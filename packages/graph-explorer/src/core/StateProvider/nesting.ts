import type { EdgeType } from "../entities";
import type {
  RenderedEdge,
  RenderedVertex,
  RenderedVertexId,
} from "./renderedEntities";

type NestedVertex = RenderedVertex & {
  data: { parent?: RenderedVertexId };
};

type NestedGraph = {
  vertices: NestedVertex[];
  edges: RenderedEdge[];
  hasInvalidNesting: boolean;
};

export function applyNesting(
  vertices: RenderedVertex[],
  edges: RenderedEdge[],
  nestingTypes: ReadonlySet<EdgeType>,
): NestedGraph {
  const countryIds = new Set<RenderedVertexId>();
  for (const { data } of vertices) {
    if (data.type === "country") countryIds.add(data.id);
  }
  const parents = new Map<RenderedVertexId, RenderedVertexId>();
  const conflicts = new Set<RenderedVertexId>();

  for (const { data } of edges) {
    if (!nestingTypes.has(data.type)) continue;
    if (data.type === "contains" && !countryIds.has(data.source)) continue;
    const previous = parents.get(data.target);
    if (previous !== undefined && previous !== data.source) {
      conflicts.add(data.target);
    }
    parents.set(data.target, data.source);
  }

  for (const id of conflicts) parents.delete(id);

  const finished = new Set<RenderedVertexId>();
  const cyclic = new Set<RenderedVertexId>();
  for (const start of parents.keys()) {
    if (finished.has(start)) continue;
    const path: RenderedVertexId[] = [];
    const indexes = new Map<RenderedVertexId, number>();
    let current: RenderedVertexId | undefined = start;

    while (
      current !== undefined &&
      !finished.has(current) &&
      !indexes.has(current)
    ) {
      indexes.set(current, path.length);
      path.push(current);
      current = parents.get(current);
    }

    const cycleStart = current === undefined ? undefined : indexes.get(current);
    if (cycleStart !== undefined) {
      for (let i = cycleStart; i < path.length; i++) cyclic.add(path[i]);
    }
    for (const id of path) finished.add(id);
  }

  for (const id of cyclic) parents.delete(id);

  return {
    vertices: vertices.map(vertex => {
      const parent = parents.get(vertex.data.id);
      return parent === undefined
        ? vertex
        : { ...vertex, data: { ...vertex.data, parent } };
    }),
    edges: edges.filter(
      ({ data }) =>
        !nestingTypes.has(data.type) ||
        parents.get(data.target) !== data.source,
    ),
    hasInvalidNesting: conflicts.size > 0 || cyclic.size > 0,
  };
}
