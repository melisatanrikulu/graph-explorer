import type cytoscape from "cytoscape";

type ComplexityManagementOptions = {
  layoutBy?: cytoscape.LayoutOptions | null;
};

declare module "cytoscape" {
  interface Core {
    complexityManagement(options?: ComplexityManagementOptions): unknown;
  }
}
