import "cytoscape";

declare module "cytoscape" {
  interface Core {
    complexityManagement(): unknown;
  }
}
