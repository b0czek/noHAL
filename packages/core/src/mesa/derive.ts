import type {
  MesaHostCatalogEntry,
  MesaSchemaProfile,
  MesaSmartSerialCatalogEntry,
} from "./catalog";
import {
  getMesaDb25CardCatalogEntry,
  getMesaHostCatalogEntry,
  getMesaSmartSerialCatalogEntry,
  isMesaConnectorCardCompatible,
  isMesaSmartSerialCardCompatible,
} from "./catalog";
import type { MesaValidationIssue } from "./hostValidation";
import { createMesaHostIpValidator } from "./hostValidation";
import {
  createMesaBitInputPins,
  createMesaEncoderModuleParams,
  createMesaEncoderModulePins,
  createMesaEncoderParams,
  createMesaEncoderPins,
  mergeMesaSchemaProfiles,
  schemaProfileSummary,
} from "./schema";
import { formatMesaGpioIndex } from "./shared";
import type {
  ProjectMesaConfig,
  ProjectMesaDb25CardAssignment,
  ProjectMesaDb25CardKind,
  ProjectMesaHostConfig,
  ProjectMesaHostKind,
  ProjectMesaSmartSerialAssignment,
  ProjectMesaSmartSerialCardKind,
} from "./types";
import { MESA_RAW_GPIO_CARD_KIND } from "./types";

export type MesaDerivedNodeFamily = "host" | "pseudo" | "db25" | "sserial";

const mesaLayout = {
  groupX: {
    start: 120,
    step: 760,
  },
  groupY: 120,
  offsetX: {
    encoder: 220,
    db25: 260,
    sserial: 520,
  },
  spacingY: {
    connector: 180,
    fragment: 96,
    directChannel: 120,
    directPort: 24,
  },
  width: {
    encoderSuffix: 2,
  },
} as const;

export interface MesaDerivedNode {
  key: string;
  hostId: string;
  family: MesaDerivedNodeFamily;
  subfamily?: string;
  componentId: string;
  instanceName: string;
  displayName: string;
  schemaProfile: MesaSchemaProfile;
  preferredPosition: { x: number; y: number };
  summary: string;
}

export interface MesaPseudoComponentSpec {
  key: string;
  subfamily: string;
  componentToken: string;
  instanceSuffix: string;
  displayNameSuffix: string;
  schemaProfile: MesaSchemaProfile;
  preferredOffset: { x: number; y: number };
  summary?: string;
}

export interface MesaDerivedHostRuntime {
  hostId: string;
  hostKind: ProjectMesaHostConfig["kind"];
  hostIndex: number;
  componentId: string;
  instanceName: string;
  driverName: string;
  ip: string;
  configString: string;
  readFunctionName: string;
  writeFunctionName: string;
}

export interface MesaDerivedTopology {
  nodes: MesaDerivedNode[];
  hostRuntimes: MesaDerivedHostRuntime[];
  issues: MesaValidationIssue[];
}

type ResolvedDb25CardAssignment = ProjectMesaDb25CardAssignment & {
  cardKind: ProjectMesaDb25CardKind;
};

type ResolvedSmartSerialAssignment = ProjectMesaSmartSerialAssignment & {
  cardKind: ProjectMesaSmartSerialCardKind;
};

type NormalizedMesaHostAssignments = {
  connectorAssignments: ResolvedDb25CardAssignment[];
  rawGpioAssignments: ProjectMesaDb25CardAssignment[];
  smartSerialAssignments: ResolvedSmartSerialAssignment[];
  connectorAssignmentsByKey: Map<string, ResolvedDb25CardAssignment>;
};

type MesaHostDerivationContext = {
  host: ProjectMesaHostConfig;
  catalogHost: MesaHostCatalogEntry;
  instanceName: string;
  groupX: number;
};

function sanitizeComponentToken(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]+/g, "_");
}

function componentIdForHost(hostId: string): string {
  return `system:mesa:host:${sanitizeComponentToken(hostId)}`;
}

function componentIdForPseudo(hostId: string, componentToken: string): string {
  return `system:mesa:pseudo:${sanitizeComponentToken(hostId)}:${sanitizeComponentToken(componentToken)}`;
}

function componentIdForDb25(
  hostId: string,
  connectorKey: string,
  fragmentKey: string,
): string {
  return `system:mesa:db25:${sanitizeComponentToken(hostId)}:${sanitizeComponentToken(
    connectorKey,
  )}:${sanitizeComponentToken(fragmentKey)}`;
}

function componentIdForSmartSerial(
  hostId: string,
  portKey: string,
  channel: number,
  connectorKey?: string,
): string {
  return `system:mesa:sserial:${sanitizeComponentToken(hostId)}:${sanitizeComponentToken(
    connectorKey ? `${connectorKey}:${portKey}` : portKey,
  )}:${channel}`;
}

function hm2InstanceNameForHost(
  host: ProjectMesaHostConfig,
  hostIndexByKind: Map<ProjectMesaHostConfig["kind"], number>,
): { instanceName: string; hostIndex: number } {
  const nextIndex = hostIndexByKind.get(host.kind) ?? 0;
  hostIndexByKind.set(host.kind, nextIndex + 1);
  return {
    instanceName: `${getMesaHostCatalogEntry(host.kind)?.driverName ?? `hm2_${host.kind}`}.${nextIndex}`,
    hostIndex: nextIndex,
  };
}

function baseGroupX(groupIndex: number): number {
  return mesaLayout.groupX.start + groupIndex * mesaLayout.groupX.step;
}

function buildEncoderPseudoComponentSpecs(
  count: number,
): MesaPseudoComponentSpec[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, index) => {
    const suffix = `${index}`.padStart(mesaLayout.width.encoderSuffix, "0");
    return {
      key: `encoder:${suffix}`,
      subfamily: "encoder",
      componentToken: `encoder:${suffix}`,
      instanceSuffix: `encoder.${suffix}`,
      displayNameSuffix: `Encoder ${suffix}`,
      schemaProfile: {
        explicitPins: createMesaEncoderPins(),
        explicitParams: createMesaEncoderParams(),
      },
      preferredOffset: {
        x: mesaLayout.offsetX.encoder,
        y: index * mesaLayout.spacingY.fragment,
      },
      summary: schemaProfileSummary({ encoders: 1 }),
    };
  });
}

function splitHostPseudoComponents(directProfile: MesaSchemaProfile): {
  hostProfile: MesaSchemaProfile;
  pseudoComponents: MesaPseudoComponentSpec[];
} {
  const pseudoComponents = buildEncoderPseudoComponentSpecs(
    directProfile.encoders ?? 0,
  );
  return {
    hostProfile: {
      ...directProfile,
      encoders: undefined,
      explicitPins: [
        ...(directProfile.explicitPins ?? []),
        ...(directProfile.encoders && directProfile.encoders > 0
          ? createMesaEncoderModulePins()
          : []),
      ],
      explicitParams: [
        ...(directProfile.explicitParams ?? []),
        ...(directProfile.encoders && directProfile.encoders > 0
          ? createMesaEncoderModuleParams({
              includeTimerNumber: directProfile.dpll,
            })
          : []),
      ],
    },
    pseudoComponents,
  };
}

function createMesaPseudoComponentNode(
  host: ProjectMesaHostConfig,
  hostDisplayName: string,
  hostInstanceName: string,
  groupOrigin: { x: number; y: number },
  spec: MesaPseudoComponentSpec,
): MesaDerivedNode {
  return {
    key: `${host.id}:${spec.key}`,
    hostId: host.id,
    family: "pseudo",
    subfamily: spec.subfamily,
    componentId: componentIdForPseudo(host.id, spec.componentToken),
    instanceName: `${hostInstanceName}.${spec.instanceSuffix}`,
    displayName: `${hostDisplayName} ${spec.displayNameSuffix}`,
    schemaProfile: spec.schemaProfile,
    preferredPosition: {
      x: groupOrigin.x + spec.preferredOffset.x,
      y: groupOrigin.y + spec.preferredOffset.y,
    },
    summary: spec.summary ?? schemaProfileSummary(spec.schemaProfile),
  };
}

function buildRawGpioProfile(
  host: ProjectMesaHostConfig,
  assignment: ProjectMesaDb25CardAssignment,
): MesaSchemaProfile | undefined {
  if (assignment.cardKind !== MESA_RAW_GPIO_CARD_KIND) return undefined;
  const connector = getMesaHostCatalogEntry(host.kind)?.connectorSlots.find(
    (item) => item.key === assignment.connectorKey,
  );
  const rawGpio = connector?.rawGpio;
  if (!rawGpio) return undefined;
  const outputPins = new Set(assignment.rawGpio?.outputPins ?? []);
  return {
    explicitPins: Array.from({ length: rawGpio.count }, (_, localPinIndex) => {
      const gpioIndex = rawGpio.firstIndex + localPinIndex;
      const gpioName = formatMesaGpioIndex(gpioIndex);
      const isOutput = outputPins.has(localPinIndex);
      if (isOutput) {
        return [
          {
            key: `gpio_${gpioName}`,
            name: `gpio.${gpioName}.out`,
            direction: "in" as const,
            type: "bit" as const,
          },
        ];
      }
      return createMesaBitInputPins({
        key: `gpio_${gpioName}`,
        name: `gpio.${gpioName}.in`,
        negatedKey: `gpio_${gpioName}_not`,
        negatedName: `gpio.${gpioName}.in_not`,
      });
    }).flat(),
  };
}

function buildHostDirectProfile(
  host: ProjectMesaHostConfig,
  connectorAssignments: ProjectMesaDb25CardAssignment[],
): MesaSchemaProfile {
  const hostCatalog = getMesaHostCatalogEntry(host.kind);
  return mergeMesaSchemaProfiles(
    hostCatalog?.directProfile,
    ...connectorAssignments.map((assignment) =>
      assignment.cardKind === MESA_RAW_GPIO_CARD_KIND
        ? buildRawGpioProfile(host, assignment)
        : getMesaDb25CardCatalogEntry(assignment.cardKind ?? "")?.hostmot
            .directProfile,
    ),
  );
}

function buildHostModuleConfigTokens(profile: MesaSchemaProfile): string[] {
  const tokens: string[] = [];
  if (profile.dpll) {
    tokens.push("num_dplls=1");
  }
  if (profile.encoders && profile.encoders > 0) {
    tokens.push(`num_encoders=${profile.encoders}`);
  }
  return tokens;
}

function buildMesaHostConfigString(
  host: ProjectMesaHostConfig,
  hostIndex: number,
  directProfile: MesaSchemaProfile,
  connectorAssignments: ProjectMesaDb25CardAssignment[],
  smartSerialAssignments: ProjectMesaSmartSerialAssignment[],
): string {
  const hostCatalog = getMesaHostCatalogEntry(host.kind);
  const tokens = [`driver=${host.kind}`, `instance=${hostIndex}`];
  const connectorAssignmentsByKey = new Map(
    connectorAssignments.map((assignment) => [
      assignment.connectorKey,
      assignment,
    ]),
  );
  const portChars = new Map<number, string[]>();
  const ensurePort = (portIndex: number, channels: number) => {
    const existing = portChars.get(portIndex);
    if (existing) {
      while (existing.length < channels) existing.push("x");
      return existing;
    }
    const created = Array.from({ length: channels }, () => "x");
    portChars.set(portIndex, created);
    return created;
  };

  tokens.push(...buildHostModuleConfigTokens(directProfile));

  for (const assignment of connectorAssignments) {
    const connector = hostCatalog?.connectorSlots.find(
      (item) => item.key === assignment.connectorKey,
    );
    const card = getMesaDb25CardCatalogEntry(assignment.cardKind ?? "");
    const address = connector?.smartSerialAddress;
    if (!connector || !card || !address) continue;
    const maxInternalChannel = card.sserial.peripheralFragments.reduce(
      (max, fragment) =>
        Math.max(max, address.channel + fragment.channelOffset),
      address.channel,
    );
    const chars = ensurePort(address.portIndex, maxInternalChannel + 1);
    for (const fragment of card.sserial.peripheralFragments) {
      chars[address.channel + fragment.channelOffset] =
        `${card.sserial.defaultMode}`;
    }
  }

  for (const assignment of smartSerialAssignments) {
    const card = getMesaSmartSerialCatalogEntry(assignment.cardKind ?? "");
    if (!card) continue;
    if (assignment.connectorKey) {
      const connectorAssignment = connectorAssignmentsByKey.get(
        assignment.connectorKey,
      );
      const connector = hostCatalog?.connectorSlots.find(
        (item) => item.key === assignment.connectorKey,
      );
      const connectorCard = getMesaDb25CardCatalogEntry(
        connectorAssignment?.cardKind ?? "",
      );
      const port = connectorCard?.sserial.smartSerialPorts.find(
        (item) => item.key === assignment.portKey,
      );
      const address = connector?.smartSerialAddress;
      if (!port || !address) continue;
      const nestedChannel =
        address.channel + port.baseChannelOffset + assignment.channel;
      const chars = ensurePort(address.portIndex, nestedChannel + 1);
      chars[nestedChannel] = `${card.defaultMode}`;
      continue;
    }
    const port = hostCatalog?.smartSerialPorts.find(
      (item) => item.key === assignment.portKey,
    );
    if (!port) continue;
    const chars = ensurePort(port.portIndex, port.channels);
    chars[assignment.channel] = `${card.defaultMode}`;
  }

  const sserialTokens = [...portChars.entries()]
    .filter(([, chars]) => chars.some((value) => value !== "x"))
    .sort(([portIndexA], [portIndexB]) => portIndexA - portIndexB)
    .map(([portIndex, chars]) => `sserial_port_${portIndex}=${chars.join("")}`);
  tokens.push(...sserialTokens);

  return tokens.join(" ");
}

function connectorInstanceAddress(
  host: ProjectMesaHostConfig,
  connectorKey: string,
): { portIndex: number; channel: number } {
  const connector = getMesaHostCatalogEntry(host.kind)?.connectorSlots.find(
    (item) => item.key === connectorKey,
  );
  return (
    connector?.smartSerialAddress ?? {
      portIndex: connector?.order ?? 0,
      channel: 0,
    }
  );
}

function normalizeMesaHostAssignments(
  host: ProjectMesaHostConfig,
): NormalizedMesaHostAssignments {
  const allConnectorAssignments = host.connectors ?? [];
  const connectorAssignments = allConnectorAssignments
    .filter((assignment) =>
      Boolean(getMesaDb25CardCatalogEntry(assignment.cardKind ?? "")),
    )
    .map((assignment) => assignment as ResolvedDb25CardAssignment);
  const rawGpioAssignments = allConnectorAssignments.filter(
    (assignment) => assignment.cardKind === MESA_RAW_GPIO_CARD_KIND,
  );
  const smartSerialAssignments = (host.smartSerial ?? [])
    .filter((assignment) => assignment.cardKind)
    .map((assignment) => assignment as ResolvedSmartSerialAssignment);

  return {
    connectorAssignments,
    rawGpioAssignments,
    smartSerialAssignments,
    connectorAssignmentsByKey: new Map(
      connectorAssignments.map((assignment) => [
        assignment.connectorKey,
        assignment,
      ]),
    ),
  };
}

export function deriveMesaTopology(
  projectMesa: ProjectMesaConfig,
): MesaDerivedTopology {
  const nodes: MesaDerivedNode[] = [];
  const hostRuntimes: MesaDerivedHostRuntime[] = [];
  const issues: MesaValidationIssue[] = [];
  const hostIndexByKind = new Map<ProjectMesaHostKind, number>();
  const validateMesaHostIp = createMesaHostIpValidator();

  const addHostNodes = (
    ctx: MesaHostDerivationContext,
    hostPinsProfile: MesaSchemaProfile,
    pseudoComponents: MesaPseudoComponentSpec[],
    groupOrigin: { x: number; y: number },
  ) => {
    nodes.push({
      key: ctx.host.id,
      hostId: ctx.host.id,
      family: "host",
      componentId: componentIdForHost(ctx.host.id),
      instanceName: ctx.instanceName,
      displayName: ctx.catalogHost.displayName,
      schemaProfile: hostPinsProfile,
      preferredPosition: groupOrigin,
      summary: schemaProfileSummary(hostPinsProfile),
    });
    for (const pseudoComponent of pseudoComponents) {
      nodes.push(
        createMesaPseudoComponentNode(
          ctx.host,
          ctx.catalogHost.displayName,
          ctx.instanceName,
          groupOrigin,
          pseudoComponent,
        ),
      );
    }
  };

  const addRawGpioIssues = (
    host: ProjectMesaHostConfig,
    catalogHost: MesaHostCatalogEntry,
    rawGpioAssignments: ProjectMesaDb25CardAssignment[],
  ) => {
    for (const assignment of rawGpioAssignments) {
      const connector = catalogHost.connectorSlots.find(
        (item) => item.key === assignment.connectorKey,
      );
      if (connector?.rawGpio) continue;
      issues.push({
        severity: "fatal",
        message: `Raw GPIO is not available on ${catalogHost.displayName} ${connector?.label ?? assignment.connectorKey}.`,
        hostId: host.id,
      });
    }
  };

  const addDb25Nodes = (
    ctx: MesaHostDerivationContext,
    connectorAssignments: ResolvedDb25CardAssignment[],
  ) => {
    for (const assignment of connectorAssignments) {
      const connector = ctx.catalogHost.connectorSlots.find(
        (item) => item.key === assignment.connectorKey,
      );
      const card = getMesaDb25CardCatalogEntry(assignment.cardKind);
      if (!connector || !card) continue;
      if (
        !isMesaConnectorCardCompatible(
          ctx.host.kind,
          assignment.connectorKey,
          assignment.cardKind,
        )
      ) {
        issues.push({
          severity: "fatal",
          message: `${card.displayName} is not compatible with ${ctx.catalogHost.displayName} ${connector.label}.`,
          hostId: ctx.host.id,
        });
        continue;
      }
      const address = connectorInstanceAddress(
        ctx.host,
        assignment.connectorKey,
      );
      for (const [
        fragmentIndex,
        fragment,
      ] of card.sserial.peripheralFragments.entries()) {
        nodes.push({
          key: `${ctx.host.id}:${assignment.connectorKey}:${fragment.key}`,
          hostId: ctx.host.id,
          family: "db25",
          componentId: componentIdForDb25(
            ctx.host.id,
            assignment.connectorKey,
            fragment.key,
          ),
          instanceName: `${ctx.instanceName}.${assignment.cardKind}.${address.portIndex}.${address.channel + fragment.channelOffset}`,
          displayName: `${card.displayName} ${connector.label} ${fragment.displayName}`,
          schemaProfile: fragment.schemaProfile,
          preferredPosition: {
            x: ctx.groupX + mesaLayout.offsetX.db25,
            y:
              mesaLayout.groupY +
              connector.order * mesaLayout.spacingY.connector +
              fragmentIndex * mesaLayout.spacingY.fragment,
          },
          summary: schemaProfileSummary(fragment.schemaProfile),
        });
      }
    }
  };

  const addSmartSerialNodes = (
    ctx: MesaHostDerivationContext,
    smartSerialAssignments: ResolvedSmartSerialAssignment[],
    connectorAssignmentsByKey: Map<string, ResolvedDb25CardAssignment>,
  ) => {
    const addConnectorSmartSerialNode = (
      assignment: ResolvedSmartSerialAssignment,
      card: MesaSmartSerialCatalogEntry,
      halInstanceName: string,
    ) => {
      const connectorAssignment = connectorAssignmentsByKey.get(
        assignment.connectorKey ?? "",
      );
      const connector = ctx.catalogHost.connectorSlots.find(
        (item) => item.key === assignment.connectorKey,
      );
      const connectorCard = connectorAssignment?.cardKind
        ? getMesaDb25CardCatalogEntry(connectorAssignment.cardKind)
        : undefined;
      const port = connectorCard?.sserial.smartSerialPorts.find(
        (item) => item.key === assignment.portKey,
      );
      if (
        !port ||
        !isMesaSmartSerialCardCompatible(
          ctx.host.kind,
          assignment,
          connectorAssignment?.cardKind,
          assignment.cardKind,
        )
      ) {
        issues.push({
          severity: "fatal",
          message: `${card.displayName} is not compatible with ${connectorCard?.displayName ?? "connector"} ${connector?.label ?? assignment.connectorKey} ${port?.label ?? assignment.portKey} channel ${assignment.channel}.`,
          hostId: ctx.host.id,
        });
        return;
      }
      const address = connector?.smartSerialAddress;
      if (!address || !connectorCard) return;
      const nestedChannel =
        address.channel + port.baseChannelOffset + assignment.channel;
      nodes.push({
        key: `${ctx.host.id}:${assignment.connectorKey}:${assignment.portKey}:${assignment.channel}`,
        hostId: ctx.host.id,
        family: "sserial",
        componentId: componentIdForSmartSerial(
          ctx.host.id,
          assignment.portKey,
          assignment.channel,
          assignment.connectorKey,
        ),
        instanceName: `${ctx.instanceName}.${halInstanceName}.${address.portIndex}.${nestedChannel}`,
        displayName: `${card.displayName} ${connector.label} ${port.label} ch${nestedChannel}`,
        schemaProfile: card.peripheralProfile,
        preferredPosition: {
          x: ctx.groupX + mesaLayout.offsetX.sserial,
          y:
            mesaLayout.groupY +
            connector.order * mesaLayout.spacingY.connector +
            connectorCard.sserial.peripheralFragments.length *
              mesaLayout.spacingY.fragment +
            assignment.channel * mesaLayout.spacingY.fragment,
        },
        summary: schemaProfileSummary(card.peripheralProfile),
      });
    };

    const addDirectSmartSerialNode = (
      assignment: ResolvedSmartSerialAssignment,
      card: MesaSmartSerialCatalogEntry,
      halInstanceName: string,
    ) => {
      const port = ctx.catalogHost.smartSerialPorts.find(
        (item) => item.key === assignment.portKey,
      );
      if (
        !port ||
        !isMesaSmartSerialCardCompatible(
          ctx.host.kind,
          assignment,
          undefined,
          assignment.cardKind,
        )
      ) {
        issues.push({
          severity: "fatal",
          message: `${card.displayName} is not compatible with ${ctx.catalogHost.displayName} ${port?.label ?? assignment.portKey} channel ${assignment.channel}.`,
          hostId: ctx.host.id,
        });
        return;
      }
      nodes.push({
        key: `${ctx.host.id}:${assignment.portKey}:${assignment.channel}`,
        hostId: ctx.host.id,
        family: "sserial",
        componentId: componentIdForSmartSerial(
          ctx.host.id,
          assignment.portKey,
          assignment.channel,
        ),
        instanceName: `${ctx.instanceName}.${halInstanceName}.${port.portIndex}.${assignment.channel}`,
        displayName: `${card.displayName} ${port.label} ch${assignment.channel}`,
        schemaProfile: card.peripheralProfile,
        preferredPosition: {
          x: ctx.groupX + mesaLayout.offsetX.sserial,
          y:
            mesaLayout.groupY +
            assignment.channel * mesaLayout.spacingY.directChannel +
            port.order * mesaLayout.spacingY.directPort,
        },
        summary: schemaProfileSummary(card.peripheralProfile),
      });
    };

    for (const assignment of smartSerialAssignments) {
      const card = getMesaSmartSerialCatalogEntry(assignment.cardKind);
      if (!card) continue;
      const halInstanceName = card.halInstanceName ?? card.displayName;
      if (assignment.connectorKey) {
        addConnectorSmartSerialNode(assignment, card, halInstanceName);
        continue;
      }
      addDirectSmartSerialNode(assignment, card, halInstanceName);
    }
  };

  for (const [groupIndex, host] of projectMesa.hosts.entries()) {
    const catalogHost = getMesaHostCatalogEntry(host.kind);
    if (!catalogHost) {
      issues.push({
        severity: "fatal",
        message: `Mesa host '${host.kind}' is not supported.`,
        hostId: host.id,
      });
      continue;
    }

    const validation = validateMesaHostIp(
      host.id,
      catalogHost.displayName,
      host.ip,
    );
    const { ip } = validation;
    issues.push(...validation.issues);
    const {
      connectorAssignments,
      rawGpioAssignments,
      smartSerialAssignments,
      connectorAssignmentsByKey,
    } = normalizeMesaHostAssignments(host);

    const hostDirectProfile = buildHostDirectProfile(
      host,
      host.connectors ?? [],
    );
    const { hostProfile: hostPinsProfile, pseudoComponents } =
      splitHostPseudoComponents(hostDirectProfile);
    const { instanceName, hostIndex } = hm2InstanceNameForHost(
      host,
      hostIndexByKind,
    );
    const ctx: MesaHostDerivationContext = {
      host,
      catalogHost,
      instanceName,
      groupX: baseGroupX(groupIndex),
    };
    const groupOrigin = { x: ctx.groupX, y: mesaLayout.groupY };
    addHostNodes(ctx, hostPinsProfile, pseudoComponents, groupOrigin);
    addRawGpioIssues(host, catalogHost, rawGpioAssignments);
    addDb25Nodes(ctx, connectorAssignments);
    addSmartSerialNodes(ctx, smartSerialAssignments, connectorAssignmentsByKey);

    hostRuntimes.push({
      hostId: host.id,
      hostKind: host.kind,
      hostIndex,
      componentId: componentIdForHost(host.id),
      instanceName,
      driverName: catalogHost.driverName,
      ip,
      configString: buildMesaHostConfigString(
        host,
        hostIndex,
        hostDirectProfile,
        connectorAssignments,
        smartSerialAssignments,
      ),
      readFunctionName: `${instanceName}.read`,
      writeFunctionName: `${instanceName}.write`,
    });
  }

  return {
    nodes,
    hostRuntimes,
    issues,
  };
}
