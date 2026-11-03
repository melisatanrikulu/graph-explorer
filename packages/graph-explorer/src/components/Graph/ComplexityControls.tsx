import { EyeIcon, FoldVerticalIcon, UnfoldVerticalIcon } from "lucide-react";

import { Button } from "@/components";

import { useGraphRef } from "./GraphContext";

export function ComplexityControls({ hasGroups }: { hasGroups: boolean }) {
  const graphRef = useGraphRef();
  return (
    <>
      <Button
        tooltip="Collapse groups"
        variant="ghost"
        size="icon"
        disabled={!hasGroups}
        onClick={() => graphRef.current?.complexity?.collapseAll()}
      >
        <FoldVerticalIcon />
      </Button>
      <Button
        tooltip="Expand groups"
        variant="ghost"
        size="icon"
        disabled={!hasGroups}
        onClick={() => graphRef.current?.complexity?.expandAll()}
      >
        <UnfoldVerticalIcon />
      </Button>
      <Button
        tooltip="Show hidden content"
        variant="ghost"
        size="icon"
        onClick={() => graphRef.current?.complexity?.showAll()}
      >
        <EyeIcon />
      </Button>
    </>
  );
}
