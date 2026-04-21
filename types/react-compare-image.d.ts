declare module "react-compare-image" {
  import type { ComponentType } from "react";

  export interface ReactCompareImageProps {
    leftImage: string;
    rightImage: string;
    leftImageAlt?: string;
    rightImageAlt?: string;
    leftImageLabel?: string;
    rightImageLabel?: string;
    leftImageCss?: object;
    rightImageCss?: object;
    aspectRatio?: "taller" | "wider";
    hover?: boolean;
    handle?: React.ReactNode;
    handleSize?: number;
    sliderLineColor?: string;
    sliderLineWidth?: number;
    sliderPositionPercentage?: number;
    skeleton?: React.ReactNode;
    vertical?: boolean;
    onSliderPositionChange?: (position: number) => void;
  }

  const ReactCompareImage: ComponentType<ReactCompareImageProps>;
  export default ReactCompareImage;
}
