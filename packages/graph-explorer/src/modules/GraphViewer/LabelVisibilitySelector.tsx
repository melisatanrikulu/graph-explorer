import type { LabelVisibilityMode } from "@/components/Graph/labelVisibility";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { labelVisibilityModeSchema } from "@/components/Graph/labelVisibility";

type LabelVisibilitySelectorProps = {
  value: LabelVisibilityMode;
  onChange(value: LabelVisibilityMode): void;
};

export function LabelVisibilitySelector({
  value,
  onChange,
}: LabelVisibilitySelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={nextValue =>
        onChange(labelVisibilityModeSchema.parse(nextValue))
      }
    >
      <SelectTrigger className="max-w-64 min-w-auto">
        <div className="flex flex-col items-start justify-center gap-0">
          <div className="text-muted-foreground text-xs leading-none">
            Labels
          </div>
          <SelectValue placeholder="Select label presentation" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="always-visible">Always visible</SelectItem>
        <SelectItem value="lightened">Lightened</SelectItem>
        <SelectItem value="contextual">Hover or selection</SelectItem>
      </SelectContent>
    </Select>
  );
}
