import { z } from "zod";

export const LABEL_HOVER_CLASS = "label-hover";

export const labelVisibilityModeSchema = z.enum([
  "always-visible",
  "lightened",
  "contextual",
]);

export type LabelVisibilityMode = z.infer<typeof labelVisibilityModeSchema>;

export const DEFAULT_LABEL_VISIBILITY_MODE: LabelVisibilityMode = "contextual";
export const LIGHTENED_LABEL_OPACITY = 0.35;
