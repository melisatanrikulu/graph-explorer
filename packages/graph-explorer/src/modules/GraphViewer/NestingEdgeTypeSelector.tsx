import { BoxesIcon } from "lucide-react";

import {
  Button,
  CheckboxList,
  EdgeIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components";
import {
  createEdgeType,
  type EdgeType,
  useDisplayEdgeTypeConfigs,
} from "@/core";

type NestingEdgeTypeSelectorProps = {
  selectedEdgeTypes: ReadonlySet<EdgeType>;
  onChange(selectedEdgeTypes: Set<EdgeType>): void;
};

export function NestingEdgeTypeSelector({
  selectedEdgeTypes,
  onChange,
}: NestingEdgeTypeSelectorProps) {
  const edgeTypeConfigs = useDisplayEdgeTypeConfigs();
  const checkboxes = Array.from(edgeTypeConfigs.values()).map(config => ({
    id: config.type,
    text: config.displayLabel,
    endAdornment: <EdgeIcon />,
  }));

  function handleChange(id: string, isSelected: boolean) {
    const next = new Set(selectedEdgeTypes);
    const edgeType = createEdgeType(id);
    if (isSelected) {
      next.add(edgeType);
    } else {
      next.delete(edgeType);
    }
    onChange(next);
  }

  function handleChangeAll(isSelected: boolean) {
    onChange(
      isSelected ? new Set(edgeTypeConfigs.keys()) : new Set<EdgeType>(),
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Configure graph nesting"
          variant={selectedEdgeTypes.size > 0 ? "primary" : "ghost"}
          size="icon"
          disabled={checkboxes.length === 0}
        >
          <BoxesIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex h-96 w-80 flex-col p-0">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">Graph nesting</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Selected relationships become parent-child nesting instead of
            visible edges.
          </p>
        </div>
        <CheckboxList
          className="min-h-0 flex-1"
          checkboxes={checkboxes}
          selectedIds={new Set(selectedEdgeTypes)}
          onChange={handleChange}
          onChangeAll={handleChangeAll}
        />
      </PopoverContent>
    </Popover>
  );
}
