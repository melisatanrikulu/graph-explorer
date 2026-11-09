import type cytoscape from "cytoscape";

type ComplexityManagementOptions = {
  layoutBy?: cytoscape.LayoutOptions | null;
};

type ComplexityManagementApi = {
  collapseEdgesBetweenNodes(nodes: cytoscape.NodeCollection): void;
  expandEdgesBetweenNodes(
    nodes: cytoscape.NodeCollection,
    recursive?: boolean,
  ): void;
};

declare module "cytoscape" {
  interface Core {
    complexityManagement(command: "get"): ComplexityManagementApi;
    complexityManagement(
      options?: ComplexityManagementOptions,
    ): ComplexityManagementApi;
  }
}
