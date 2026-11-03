import { useEffect, useState } from "react";

import type { CytoscapeType, GraphEdge, GraphNode } from "../Graph.model";

import { getComplexityController } from "../complexity";
import { updateGraphElements } from "../helpers/updateGraphElements";

export interface UseUpdateGraphElementsProps {
  cy?: CytoscapeType;
  nodes: GraphNode[];
  edges: GraphEdge[];
  lockedNodesIds: Set<string>;
  disableLockOnChange?: boolean;
  manageComplexity?: boolean;
  filteredElementIds?: ReadonlySet<string>;
}

const EMPTY_IDS: ReadonlySet<string> = new Set();

const useUpdateGraphElements = ({
  cy,
  nodes,
  edges,
  lockedNodesIds,
  disableLockOnChange,
  manageComplexity = false,
  filteredElementIds = EMPTY_IDS,
}: UseUpdateGraphElementsProps) => {
  const [graphStructureVersion, setGraphStructureVersion] = useState(0);

  useEffect(() => {
    if (!cy || !manageComplexity) return;
    function handleComplexityChange() {
      setGraphStructureVersion(version => version + 1);
    }
    cy.on("complexitychange", handleComplexityChange);
    return () => {
      cy.off("complexitychange", handleComplexityChange);
    };
  }, [cy, manageComplexity]);

  useEffect(() => {
    if (!cy) {
      return;
    }

    if (manageComplexity) {
      getComplexityController(cy).synchronize(nodes, edges, filteredElementIds);
    } else if (updateGraphElements(cy, nodes, edges)) {
      // oxlint-disable-next-line react-compiler/set-state-in-effect
      setGraphStructureVersion(v => v + 1);
    }
  }, [
    cy,
    nodes,
    edges,
    lockedNodesIds,
    disableLockOnChange,
    manageComplexity,
    filteredElementIds,
  ]);

  return graphStructureVersion;
};

export default useUpdateGraphElements;
