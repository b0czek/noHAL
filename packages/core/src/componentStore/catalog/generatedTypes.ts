import type { LinuxCncVersion } from "../../linuxcncVersion";
import type { ImportedComponentDefinition } from "../../types";

export interface GeneratedCatalogVersionMetadata {
  refName: string;
  revision: string;
  generatedAt: string;
}

export type GeneratedCatalogVersionMetadataMap = Record<
  LinuxCncVersion,
  GeneratedCatalogVersionMetadata
>;

export type GeneratedCatalogVersionlessComponentDefinition = Omit<
  ImportedComponentDefinition,
  "id" | "sourcePath"
> & {
  id: string;
  sourcePath?: string;
};

export interface GeneratedCatalogComponentVariant {
  fromVersion: LinuxCncVersion;
  component: GeneratedCatalogVersionlessComponentDefinition | null;
}

export interface GeneratedCatalogComponentHistory {
  halComponentName: string;
  variants: GeneratedCatalogComponentVariant[];
}
