import type {
  Badge,
  BadgeRenderer,
} from "@/components/Graph/hooks/useRenderBadges";
import type { LabelVisibilityMode } from "@/components/Graph/labelVisibility";
import type { RenderedVertexId } from "@/core";

import { LIGHTENED_LABEL_OPACITY } from "@/components/Graph/labelVisibility";

type NodeLabelPresentation = {
  backgroundColor: string;
  color: string;
  hidden: boolean;
};

function getNodeLabelPresentation(
  mode: LabelVisibilityMode,
  isStructural: boolean,
  isInteractive: boolean,
): NodeLabelPresentation {
  if (isStructural || isInteractive || mode === "always-visible") {
    return {
      backgroundColor: "rgba(29,37,49,0.6)",
      color: "rgba(255,255,255,1)",
      hidden: false,
    };
  }

  if (mode === "lightened") {
    return {
      backgroundColor: `rgba(29,37,49,${0.6 * LIGHTENED_LABEL_OPACITY})`,
      color: `rgba(255,255,255,${LIGHTENED_LABEL_OPACITY})`,
      hidden: false,
    };
  }

  return {
    backgroundColor: "rgba(29,37,49,0.6)",
    color: "rgba(255,255,255,1)",
    hidden: true,
  };
}

const useNodeBadges = () => {
  return (
    outOfFocusIds: Set<RenderedVertexId>,
    labelVisibilityMode: LabelVisibilityMode,
  ): BadgeRenderer =>
    (
      nodeData,
      boundingBox,
      { isCompoundParent, isHovered, isSelected, zoomLevel },
    ) => {
      const presentation = getNodeLabelPresentation(
        labelVisibilityMode,
        isCompoundParent,
        isHovered || isSelected,
      );

      return [
        {
          text: nodeData.displayName,
          hidden:
            zoomLevel === "small" ||
            outOfFocusIds.has(nodeData.id) ||
            presentation.hidden,
          title: zoomLevel === "large" ? nodeData.displayTypes : undefined,
          maxWidth: zoomLevel === "large" ? 80 : 50,
          anchor: "center",
          fontSize: 7,
          borderRadius: 2,
          backgroundColor: presentation.backgroundColor,
          color: presentation.color,
          paddingLeft: 2,
          paddingRight: 2,
          paddingBottom: 2,
          paddingTop: 2,
          boundingBox: {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y + boundingBox.height - 6,
            width: "auto",
            height: "auto",
          },
        } satisfies Badge,
        {
          hidden:
            zoomLevel === "small" ||
            outOfFocusIds.has(nodeData.id) ||
            !nodeData.neighborCount,
          text: String(nodeData.neighborCount),
          anchor: "center",
          fontSize: 5,
          borderRadius: 4,
          backgroundColor: "rgba(29,37,49,0.6)",
          paddingLeft: 3,
          paddingRight: 3,
          boundingBox: {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y - 6,
            width: "auto",
            height: "auto",
          },
        },
      ];
    };
};

export default useNodeBadges;
