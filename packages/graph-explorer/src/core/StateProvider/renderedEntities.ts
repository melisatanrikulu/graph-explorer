import { useAtomValue } from "jotai";

import type { Branded } from "@/utils";

import {
  type DisplayEdge,
  type DisplayVertex,
  edgesFilteredIdsAtom,
  edgesTypesFilteredAtom,
  type EntityRawId,
  nodesFilteredIdsAtom,
  nodesTypesFilteredAtom,
  useAllNeighbors,
  useDisplayEdgesInCanvas,
  useDisplayVerticesInCanvas,
  type VertexId,
} from "@/core";

import type { EdgeType } from "../entities";
import type { EdgeId } from "../entities/edge";

import { edgeStyleAtom } from "./graphStyles";
import { applyNesting } from "./nesting";

/** A string representation of a vertex ID that encodes the original type. Cytoscape requires IDs to be strings. */
export type RenderedVertexId = Branded<string, "RenderedVertexId">;

/** A string representation of an edge ID that encodes the original type. Cytoscape requires IDs to be strings. */
export type RenderedEdgeId = Branded<string, "RenderedEdgeId">;

/** A representation of a vertex that Cytoscape can use. */
export type RenderedVertex = ReturnType<typeof createRenderedVertex>;

/** A representation of an edge that Cytoscape can use. */
export type RenderedEdge = ReturnType<typeof createRenderedEdge>;

type VertexCollections = {
  all: RenderedVertex[];
  visible: RenderedVertex[];
  allIds: Set<VertexId>;
  visibleIds: Set<VertexId>;
  filteredIds: Set<RenderedVertexId>;
};

function useVertexCollections(): VertexCollections {
  const hiddenIds = useAtomValue(nodesFilteredIdsAtom);
  const filteredTypes = useAtomValue(nodesTypesFilteredAtom);
  const displayVerticesInGraph = useDisplayVerticesInCanvas();
  const neighborCounts = useAllNeighbors();

  const all: RenderedVertex[] = [];
  const visible: RenderedVertex[] = [];
  const allIds = new Set<VertexId>();
  const visibleIds = new Set<VertexId>();
  const filteredIds = new Set<RenderedVertexId>();

  for (const vertex of displayVerticesInGraph.values()) {
    const neighborCount = neighborCounts.get(vertex.id)?.unfetched ?? 0;
    const rendered = createRenderedVertex(vertex, neighborCount);
    all.push(rendered);
    allIds.add(vertex.id);
    if (
      hiddenIds.has(vertex.id) ||
      vertex.types.some(type => filteredTypes.has(type))
    ) {
      filteredIds.add(rendered.data.id);
    } else {
      visible.push(rendered);
      visibleIds.add(vertex.id);
    }
  }

  return { all, visible, allIds, visibleIds, filteredIds };
}

function useEdgeCollections(vertices: VertexCollections) {
  const edges = useDisplayEdgesInCanvas();
  const filteredEdgeIds = useAtomValue(edgesFilteredIdsAtom);
  const filteredEdgeTypes = useAtomValue(edgesTypesFilteredAtom);
  const all: RenderedEdge[] = [];
  const visible: RenderedEdge[] = [];
  const filteredIds = new Set<RenderedEdgeId>();

  for (const edge of edges.values()) {
    if (
      !vertices.allIds.has(edge.sourceId) ||
      !vertices.allIds.has(edge.targetId)
    )
      continue;
    const rendered = createRenderedEdge(edge);
    all.push(rendered);
    if (
      filteredEdgeTypes.has(edge.type) ||
      filteredEdgeIds.has(edge.id) ||
      !vertices.visibleIds.has(edge.sourceId) ||
      !vertices.visibleIds.has(edge.targetId)
    ) {
      filteredIds.add(rendered.data.id);
    } else {
      visible.push(rendered);
    }
  }

  return { all, visible, filteredIds };
}

/** Returns the filtered vertices for use by Cytoscape. */
export function useRenderedVertices() {
  return useVertexCollections().visible;
}

/** Returns the filtered edges for use by Cytoscape. */
export function useRenderedEdges() {
  return useEdgeCollections(useVertexCollections()).visible;
}

function useNestedGraph(vertices: RenderedVertex[], edges: RenderedEdge[]) {
  const styles = useAtomValue(edgeStyleAtom);
  const nestingTypes = new Set<EdgeType>();
  for (const { data } of edges) {
    if (styles.get(data.type).useAsNesting) nestingTypes.add(data.type);
  }
  return applyNesting(vertices, edges, nestingTypes);
}

export function useRenderedEntities() {
  const vertices = useVertexCollections();
  const edges = useEdgeCollections(vertices);
  return useNestedGraph(vertices.visible, edges.visible);
}

export function useComplexityGraph() {
  const vertices = useVertexCollections();
  const edges = useEdgeCollections(vertices);
  const graph = useNestedGraph(vertices.all, edges.all);
  const filteredIds = new Set<RenderedVertexId | RenderedEdgeId>(
    vertices.filteredIds,
  );
  for (const id of edges.filteredIds) filteredIds.add(id);
  return { ...graph, filteredIds };
}

/** Maps a VertexId to a string with the original type prefixed. */
export function createRenderedVertexId(id: VertexId): RenderedVertexId {
  return prefixIdWithType(id) as RenderedVertexId;
}

/** Maps an EdgeId to a string with the original type prefixed. */
export function createRenderedEdgeId(id: EdgeId): RenderedEdgeId {
  return prefixIdWithType(id) as RenderedEdgeId;
}

/** Strips the ID type prefix from the given ID and returns the value as a VertexId. */
export function getVertexIdFromRenderedVertexId(
  id: RenderedVertexId,
): VertexId {
  if (isIdNumber(id)) {
    return parseInt(stripIdTypePrefix(id)) as VertexId;
  }
  if (isIdString(id)) {
    return stripIdTypePrefix(id) as VertexId;
  }
  return String(id) as VertexId;
}

/** Strips the ID type prefix from the given ID and returns the value as an EdgeId. */
export function getEdgeIdFromRenderedEdgeId(id: RenderedEdgeId): EdgeId {
  if (isIdNumber(id)) {
    return parseInt(stripIdTypePrefix(id)) as EdgeId;
  }
  if (isIdString(id)) {
    return stripIdTypePrefix(id) as EdgeId;
  }
  return String(id) as EdgeId;
}

const ID_TYPE_NUM_PREFIX = "(num)";
const ID_TYPE_STR_PREFIX = "(str)";

function prefixIdWithType(id: EntityRawId): string {
  if (typeof id === "number") {
    return `${ID_TYPE_NUM_PREFIX}${id}`;
  }

  return `${ID_TYPE_STR_PREFIX}${id}`;
}

function isIdNumber(id: string): boolean {
  return id.startsWith(ID_TYPE_NUM_PREFIX);
}

function isIdString(id: string): boolean {
  return id.startsWith(ID_TYPE_STR_PREFIX);
}

function stripIdTypePrefix(id: string): string {
  if (isIdNumber(id)) {
    return id.slice(ID_TYPE_NUM_PREFIX.length);
  }
  if (isIdString(id)) {
    return id.slice(ID_TYPE_STR_PREFIX.length);
  }
  return id;
}

/**
 * Creates a representation of a vertex that Cytoscape can use.
 *
 * Cytoscape expects a few things:
 * - The `id` property is a string
 * - There exists a `data` property where any custom data is stored
 */
function createRenderedVertex(vertex: DisplayVertex, neighborCount: number) {
  return {
    data: {
      id: createRenderedVertexId(vertex.id),
      type: vertex.primaryType,
      vertexId: vertex.id,
      displayName: vertex.displayName,
      displayTypes: vertex.displayTypes,
      neighborCount,
    },
  };
}

/**
 * Creates a representation of an edge that Cytoscape can use.
 *
 * Cytoscape expects a few things:
 * - The `id` property is a string
 * - The `source` and `target` properties are strings
 * - There exists a `data` property where any custom data is stored
 */
function createRenderedEdge(edge: DisplayEdge) {
  return {
    data: {
      id: createRenderedEdgeId(edge.id),
      source: createRenderedVertexId(edge.sourceId),
      target: createRenderedVertexId(edge.targetId),
      edgeId: edge.id,
      type: edge.type,
      displayName: edge.displayName,
    },
  };
}
