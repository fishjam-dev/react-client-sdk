import isEqual from "lodash.isequal";
import { MembraneClientConfig } from "./createNoContextMembraneClient";

export const DEFAULT_MEMBRANE_CLIENT_CONFIG: MembraneClientConfig = {
  isEqual,
} as const;
