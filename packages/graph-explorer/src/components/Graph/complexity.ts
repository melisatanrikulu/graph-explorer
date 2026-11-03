import type cytoscape from "cytoscape";

import { z } from "zod";

import type { CytoscapeType, GraphEdge, GraphNode } from "./Graph.model";

import { updateGraphElements } from "./helpers/updateGraphElements";

const positionSchema = z.object({ x: z.number(), y: z.number() });

export function createComplexityController(cy: CytoscapeType) {
  const api = cy.complexityManagement({ cueEnabled: false });
  const collapsed = new Set<string>();
  const hidden = new Set<string>();
  let filtered: ReadonlySet<string> = new Set();
  let sourceNodes: GraphNode[] = [];
  let sourceNodeIds = new Set<string>();

  function restore() {
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
      restore();
      const newPositions = new Map<string, cytoscape.Position>();
      for (const node of nodes) {
        if (
          !sourceNodeIds.has(node.data.id) &&
          node.data.parent !== undefined &&
          sourceNodeIds.has(node.data.parent)
        ) {
          newPositions.set(node.data.id, {
            ...cy.getElementById(node.data.parent).position(),
          });
        }
      }
      updateGraphElements(cy, nodes, edges);
      for (const [id, position] of newPositions)
        cy.getElementById(id).position(position);
      if (sourceNodeIds.size > 0) {
        const added = cy
          .nodes(":orphan:childless")
          .filter(node => !sourceNodeIds.has(node.id()));
        if (added.length > 0)
          cy.layoutUtilities({ idealEdgeLength: 100 }).placeNewNodes(added);
      }
      sourceNodes = nodes;
      filtered = filteredIds;
      const parents = new Set<string>();
      const ids = new Set<string>();
      sourceNodeIds = new Set();
      for (const node of nodes) {
        ids.add(node.data.id);
        sourceNodeIds.add(node.data.id);
        if (node.data.parent !== undefined) parents.add(node.data.parent);
      }
      for (const edge of edges) ids.add(edge.data.id);
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
        for (const node of sourceNodes) {
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
