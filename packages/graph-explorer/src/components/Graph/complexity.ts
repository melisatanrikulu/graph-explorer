import type cytoscape from "cytoscape";

import { z } from "zod";

import type { CytoscapeType, GraphEdge, GraphNode } from "./Graph.model";

import { stopLayout } from "./helpers/layout";
import { updateGraphElements } from "./helpers/updateGraphElements";

const positionSchema = z.object({ x: z.number(), y: z.number() });

function haveSameIds(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

function hasSameStructure(
  nodes: GraphNode[],
  edges: GraphEdge[],
  previousNodes: ReadonlyMap<string, GraphNode>,
  previousEdges: ReadonlyMap<string, GraphEdge>,
) {
  if (
    nodes.length !== previousNodes.size ||
    edges.length !== previousEdges.size
  )
    return false;
  for (const { data } of nodes) {
    const previous = previousNodes.get(data.id);
    if (!previous || previous.data.parent !== data.parent) return false;
  }
  for (const { data } of edges) {
    const previous = previousEdges.get(data.id);
    if (
      !previous ||
      previous.data.source !== data.source ||
      previous.data.target !== data.target
    )
      return false;
  }
  return true;
}

export function createComplexityController(cy: CytoscapeType) {
  const api = cy.complexityManagement({ cueEnabled: false });
  const collapsed = new Set<string>();
  const hidden = new Set<string>();
  let filtered: ReadonlySet<string> = new Set();
  let sourceNodes = new Map<string, GraphNode>();
  let sourceEdges = new Map<string, GraphEdge>();

  function updateElementData() {
    for (const { data } of sourceNodes.values())
      cy.getElementById(data.id).data(data);
    for (const { data } of sourceEdges.values())
      cy.getElementById(data.id).data(data);
  }

  function restore() {
    stopLayout(cy);
    const shifts = cy.nodes(".cy-expand-collapse-collapsed-node").map(node => {
      const before = positionSchema.parse(
        node.data("position-before-collapse"),
      );
      return {
        id: node.id(),
        x: node.position("x") - before.x,
        y: node.position("y") - before.y,
      };
    });
    api.updateFilterRule(() => false);
    api.showAll();
    api.expandAllNodes();
    for (const shift of shifts) {
      cy.getElementById(shift.id)
        .descendants()
        .shift({ x: shift.x, y: shift.y });
    }
    updateElementData();
  }

  function applyView() {
    for (const id of collapsed) {
      const node = cy.getElementById(id).nodes();
      if (node.length > 0 && api.isCollapsible(node[0]))
        api.collapseNodes(node);
    }
    const toHide = cy.elements().filter(element => hidden.has(element.id()));
    if (toHide.length > 0) api.hide(toHide);
    api.updateFilterRule(element => filtered.has(element.id()));
    cy.edges("[compound]").unselectify();
    cy.emit("complexitychange");
  }

  function changeView(change: () => void) {
    restore();
    change();
    applyView();
  }

  return {
    synchronize(
      nodes: GraphNode[],
      edges: GraphEdge[],
      filteredIds: ReadonlySet<string>,
    ) {
      if (hasSameStructure(nodes, edges, sourceNodes, sourceEdges)) {
        for (const node of nodes) sourceNodes.set(node.data.id, node);
        for (const edge of edges) sourceEdges.set(edge.data.id, edge);
        updateElementData();
        if (!haveSameIds(filtered, filteredIds)) {
          changeView(() => {
            filtered = filteredIds;
          });
        }
        return;
      }
      restore();
      const newPositions = new Map<string, cytoscape.Position>();
      for (const node of nodes) {
        if (
          !sourceNodes.has(node.data.id) &&
          node.data.parent !== undefined &&
          sourceNodes.has(node.data.parent)
        ) {
          newPositions.set(node.data.id, {
            ...cy.getElementById(node.data.parent).position(),
          });
        }
      }
      updateGraphElements(cy, nodes, edges);
      for (const [id, position] of newPositions)
        cy.getElementById(id).position(position);
      if (sourceNodes.size > 0) {
        const added = cy
          .nodes(":orphan:childless")
          .filter(node => !sourceNodes.has(node.id()));
        if (added.length > 0)
          cy.layoutUtilities({ idealEdgeLength: 100 }).placeNewNodes(added);
      }
      filtered = filteredIds;
      const parents = new Set<string>();
      const ids = new Set<string>();
      sourceNodes = new Map();
      sourceEdges = new Map();
      for (const node of nodes) {
        ids.add(node.data.id);
        sourceNodes.set(node.data.id, node);
        if (node.data.parent !== undefined) parents.add(node.data.parent);
      }
      for (const edge of edges) {
        ids.add(edge.data.id);
        sourceEdges.set(edge.data.id, edge);
      }
      for (const id of collapsed) if (!parents.has(id)) collapsed.delete(id);
      for (const id of hidden) if (!ids.has(id)) hidden.delete(id);
      applyView();
    },
    canCollapse(nodes: cytoscape.NodeCollection) {
      return nodes.length > 0 && api.isCollapsible(nodes[0]);
    },
    canExpand(nodes: cytoscape.NodeCollection) {
      return nodes.length > 0 && api.isExpandable(nodes[0]);
    },
    collapse(nodes: cytoscape.NodeCollection) {
      changeView(() =>
        nodes.forEach(node => {
          collapsed.add(node.id());
        }),
      );
    },
    expand(nodes: cytoscape.NodeCollection) {
      changeView(() =>
        nodes.forEach(node => {
          collapsed.delete(node.id());
        }),
      );
    },
    collapseAll() {
      changeView(() => {
        for (const node of sourceNodes.values()) {
          if (node.data.parent !== undefined) collapsed.add(node.data.parent);
        }
      });
    },
    expandAll() {
      changeView(() => collapsed.clear());
    },
    hide(elements: cytoscape.CollectionArgument) {
      const ids = cy.collection(elements).map(element => element.id());
      changeView(() => ids.forEach(id => hidden.add(id)));
    },
    showAll() {
      changeView(() => hidden.clear());
    },
  };
}

export type ComplexityController = ReturnType<
  typeof createComplexityController
>;

const controllers = new WeakMap<CytoscapeType, ComplexityController>();

export function getComplexityController(cy: CytoscapeType) {
  let controller = controllers.get(cy);
  if (!controller) {
    controller = createComplexityController(cy);
    controllers.set(cy, controller);
  }
  return controller;
}
