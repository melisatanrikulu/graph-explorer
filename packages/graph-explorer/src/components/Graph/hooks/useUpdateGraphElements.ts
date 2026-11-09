import { useEffect, useState } from "react";

import type { CytoscapeType, GraphEdge, GraphNode } from "../Graph.model";

import { updateGraphElements } from "../helpers/updateGraphElements";

export interface UseUpdateGraphElementsProps {
  cy?: CytoscapeType;
  nodes: GraphNode[];
  edges: GraphEdge[];
  lockedNodesIds: Set<string>;
  disableLockOnChange?: boolean;
}

const useUpdateGraphElements = ({
  cy,
  nodes,
  edges,
  lockedNodesIds,
  disableLockOnChange,
}: UseUpdateGraphElementsProps) => {
  const [graphStructureVersion, setGraphStructureVersion] = useState(0);

  useEffect(() => {
    if (!cy) {
      return;
    }

    if (updateGraphElements(cy, nodes, edges)) {
      // oxlint-disable-next-line react-compiler/set-state-in-effect
      setGraphStructureVersion(v => v + 1);
    }
  }, [cy, nodes, edges, lockedNodesIds, disableLockOnChange]);

  return graphStructureVersion;
};

export default useUpdateGraphElements;
