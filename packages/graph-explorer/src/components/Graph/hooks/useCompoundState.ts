import { useSyncExternalStore } from "react";

import type { RenderedVertexId } from "@/core";

import { useGraphRef } from "../GraphContext";

export function useCompoundState(id: RenderedVertexId) {
  const graphRef = useGraphRef();
  return useSyncExternalStore(
    listener => {
      const cy = graphRef.current?.cytoscape;
      cy?.on("complexitychange", listener);
      return () => {
        cy?.off("complexitychange", listener);
      };
    },
    () => {
      const graph = graphRef.current;
      if (!graph?.cytoscape || !graph.complexity) return "leaf";
      const node = graph.cytoscape.getElementById(id).nodes();
      if (graph.complexity.canCollapse(node)) return "expanded";
      if (graph.complexity.canExpand(node)) return "collapsed";
      return "leaf";
    },
  );
}
