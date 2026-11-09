import type cytoscape from "cytoscape";

import cloneDeep from "lodash/cloneDeep";

import type { CytoscapeType, GraphEdge, GraphNode } from "../Graph.model";

function orderByParent(nodes: GraphNode[]) {
  const ordered: GraphNode[] = [];
  const children = new Map<string, GraphNode[]>();

  for (const node of nodes) {
    const parent = node.data.parent;
    if (parent === undefined) {
      ordered.push(node);
      continue;
    }

    const siblings = children.get(parent);
    if (siblings) siblings.push(node);
    else children.set(parent, [node]);
  }

  for (let index = 0; index < ordered.length; index += 1) {
    const nested = children.get(ordered[index].data.id);
    if (nested) ordered.push(...nested);
  }

  if (ordered.length !== nodes.length) {
    throw new Error(
      "Compound parents must exist and form an acyclic hierarchy",
    );
  }

  return ordered;
}

function haveDifferentIds(
  elements: cytoscape.NodeCollection | cytoscape.EdgeCollection,
  ids: ReadonlySet<string>,
) {
  if (elements.length !== ids.size) return true;

  let different = false;
  elements.forEach(element => {
    if (!ids.has(element.id())) different = true;
  });
  return different;
}

export function updateGraphElements(
  cy: CytoscapeType,
  nodes: GraphNode[],
  edges: GraphEdge[],
) {
  const parentsChanged = nodes.some(
    node =>
      (cy.getElementById(node.data.id).data("parent") ?? null) !==
      (node.data.parent ?? null),
  );
  const nodeIds = new Set(nodes.map(node => node.data.id));
  const edgeIds = new Set(edges.map(edge => edge.data.id));
  const structureChanged =
    parentsChanged ||
    haveDifferentIds(cy.nodes(), nodeIds) ||
    haveDifferentIds(cy.edges(), edgeIds);
  const elements = cloneDeep({ nodes: orderByParent(nodes), edges });

  cy.batch(() => {
    if (parentsChanged) cy.nodes(":child").move({ parent: null });
    cy.json({ elements });
  });

  return structureChanged;
}
