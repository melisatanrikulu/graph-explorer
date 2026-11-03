import "cytoscape";

declare module "cytoscape" {
  interface Core {
    layoutUtilities(options?: {
      idealEdgeLength?: number;
    }): {
      placeNewNodes(nodes: NodeCollection): void;
    };
  }
}