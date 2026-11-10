import type cytoscape from "cytoscape";

import { useEffect } from "react";

import type { CytoscapeType } from "../Graph.model";

import { LABEL_HOVER_CLASS } from "../labelVisibility";

export default function useManageElementHover(cy?: CytoscapeType) {
  useEffect(() => {
    if (!cy) {
      return;
    }

    function handleMouseOver(event: cytoscape.EventObject) {
      event.target.addClass(LABEL_HOVER_CLASS);
    }

    function handleMouseOut(event: cytoscape.EventObject) {
      event.target.removeClass(LABEL_HOVER_CLASS);
    }

    cy.on("mouseover", "node, edge", handleMouseOver);
    cy.on("mouseout", "node, edge", handleMouseOut);

    return () => {
      cy.off("mouseover", "node, edge", handleMouseOver);
      cy.off("mouseout", "node, edge", handleMouseOut);
      cy.elements().removeClass(LABEL_HOVER_CLASS);
    };
  }, [cy]);
}
