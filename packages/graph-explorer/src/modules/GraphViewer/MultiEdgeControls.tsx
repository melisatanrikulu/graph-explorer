import { FoldHorizontalIcon, UnfoldHorizontalIcon } from "lucide-react";

import { Button } from "@/components";
import { useGraphRef } from "@/components/Graph";

type MultiEdgeControlsProps = {
  selectedNodeIds: readonly string[];
};

export function MultiEdgeControls({ selectedNodeIds }: MultiEdgeControlsProps) {
  const graphRef = useGraphRef();
  const disabled = selectedNodeIds.length < 2;

  function getSelectedNodes() {
    const cy = graphRef.current?.cytoscape;
    if (!cy) return;

    const selectedIds = new Set(selectedNodeIds);
    return cy.nodes().filter(node => selectedIds.has(node.id()));
  }

  function collapseEdges() {
    const cy = graphRef.current?.cytoscape;
    const nodes = getSelectedNodes();
    if (!cy || !nodes) return;

    cy.complexityManagement("get").collapseEdgesBetweenNodes(nodes);
  }

  function expandEdges() {
    const cy = graphRef.current?.cytoscape;
    const nodes = getSelectedNodes();
    if (!cy || !nodes) return;

    cy.complexityManagement("get").expandEdgesBetweenNodes(nodes);
  }

  return (
    <>
      <Button
        tooltip="Collapse edges between selected nodes"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={collapseEdges}
      >
        <FoldHorizontalIcon />
      </Button>
      <Button
        tooltip="Expand edges between selected nodes"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={expandEdges}
      >
        <UnfoldHorizontalIcon />
      </Button>
    </>
  );
}
