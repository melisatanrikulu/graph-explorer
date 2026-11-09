type NestableNode = {
  data: {
    id: string;
    type: string;
    parent?: string;
  };
};

type NestingEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    type: string;
  };
};

type NestedNode<TNode extends NestableNode> = Omit<TNode, "data"> & {
  data: TNode["data"] & { parent?: string };
};

type NestedGraphElements<
  TNode extends NestableNode,
  TEdge extends NestingEdge,
> = {
  nodes: NestedNode<TNode>[];
  edges: TEdge[];
};

export function nestGraphElements<
  TNode extends NestableNode,
  TEdge extends NestingEdge,
>(
  nodes: TNode[],
  edges: TEdge[],
  nestingEdgeTypes: ReadonlySet<string>,
): NestedGraphElements<TNode, TEdge> {
  if (nestingEdgeTypes.size === 0) {
    return { nodes, edges };
  }

  const nodesById = new Map(nodes.map(node => [node.data.id, node]));
  const parentByChild = new Map<string, string>();
  const ambiguousChildren = new Set<string>();

  for (const edge of edges) {
    const { source, target, type } = edge.data;
    if (!nestingEdgeTypes.has(type)) continue;
    if (!nodesById.has(source) || !nodesById.has(target) || source === target) {
      continue;
    }
    if (type === "contains" && nodesById.get(source)?.data.type !== "country")
      continue;

    const existingParent = parentByChild.get(target);
    if (existingParent && existingParent !== source) {
      ambiguousChildren.add(target);
      continue;
    }
    parentByChild.set(target, source);
  }

  for (const child of ambiguousChildren) {
    parentByChild.delete(child);
  }

  removeCyclicParents(parentByChild);

  return {
    nodes: nodes.map(node => {
      const parent = parentByChild.get(node.data.id);
      if (!parent) return node;
      return { ...node, data: { ...node.data, parent } };
    }),
    edges: edges.filter(edge => {
      const { source, target, type } = edge.data;
      return (
        !nestingEdgeTypes.has(type) || parentByChild.get(target) !== source
      );
    }),
  };
}

function removeCyclicParents(parentByChild: Map<string, string>) {
  const completed = new Set<string>();
  const cyclicNodes = new Set<string>();

  for (const start of parentByChild.keys()) {
    if (completed.has(start)) continue;

    const path: string[] = [];
    const pathIndexes = new Map<string, number>();
    let current: string | undefined = start;

    while (current && !completed.has(current)) {
      const cycleStart = pathIndexes.get(current);
      if (cycleStart != null) {
        for (let index = cycleStart; index < path.length; index += 1) {
          cyclicNodes.add(path[index]);
        }
        break;
      }

      pathIndexes.set(current, path.length);
      path.push(current);
      current = parentByChild.get(current);
    }

    for (const node of path) {
      completed.add(node);
    }
  }

  for (const node of cyclicNodes) {
    parentByChild.delete(node);
  }
}
