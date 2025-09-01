declare module "save-svg-as-png" {
  export interface Options {
    scale?: number;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    encoderType?: string;
    encoderOptions?: number;
  }

  export function saveSvgAsPng(
    el: SVGElement,
    filename: string,
    options?: Options,
  ): Promise<void>;

  export function svgAsDataUri(
    el: SVGElement,
    options?: Options,
  ): Promise<string>;
}
