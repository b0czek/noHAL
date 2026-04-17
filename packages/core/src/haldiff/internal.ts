import type { HalComponentMatch, HalDiffConnectionSummary } from "./types";

export const SEARCH_STEP_LIMIT = 100_000;
export const MIN_OVERLAP_SCORE = 1;
export const UNMAPPED_COMPONENT_PREFIX = "__before_unmapped__";

export interface HalGraphAttachment {
  componentId: string;
  pinName: string;
}

export interface HalGraphComponent {
  id: string;
  instanceName: string;
  componentType?: string;
  attachments: HalGraphAttachmentWithSignal[];
}

export interface HalGraphAttachmentWithSignal extends HalGraphAttachment {
  signalId: string;
}

export interface HalGraphSignal {
  id: string;
  signalName: string;
  attachments: HalGraphAttachment[];
}

export interface HalNetworkGraph {
  components: Map<string, HalGraphComponent>;
  signals: Map<string, HalGraphSignal>;
}

export interface HalGraphColorState {
  componentBaseSignatures: Map<string, string>;
  signalBaseSignatures: Map<string, string>;
  componentColors: Map<string, string>;
  signalColors: Map<string, string>;
}

export interface SearchResult {
  mapping: Map<string, string> | null;
  warnings: string[];
}

export interface BestEffortMatch {
  mapping: Map<string, string>;
  confidences: Map<string, HalComponentMatch["confidence"]>;
}

export interface IndexedGraph {
  signalIdsByAttachmentKey: Map<string, string[]>;
}

export interface NormalizedSignalDescriptor {
  signalName: string;
  normalizedKeys: string[];
  connections: HalDiffConnectionSummary[];
}
