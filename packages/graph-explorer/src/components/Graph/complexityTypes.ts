import type cytoscape from "cytoscape";

export interface ComplexityApi {
  updateFilterRule(
    rule: (element: cytoscape.SingularElementReturnValue) => boolean,
  ): void;
  hide(elements: cytoscape.CollectionArgument): void;
  showAll(): void;
  collapseNodes(nodes: cytoscape.NodeCollection, recursive?: boolean): void;
  collapseAllNodes(): void;
  expandAllNodes(): void;
  isCollapsible(node: cytoscape.NodeSingular): boolean;
  isExpandable(node: cytoscape.NodeSingular): boolean;
}

declare module "cytoscape" {
  interface Core {
    complexityManagement(options: { cueEnabled: boolean }): ComplexityApi;
  }
}
