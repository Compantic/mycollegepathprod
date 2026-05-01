declare module "react-simple-maps" {
  import * as React from "react";

  export interface PreparedGeography {
    rsmKey: string;
    svgPath: string;
    id?: string | number;
    properties?: { name?: string };
    geometry?: unknown;
    type?: string;
    [key: string]: unknown;
  }

  export interface GeographiesRenderArgs {
    geographies: PreparedGeography[];
    outline?: unknown;
    borders?: unknown;
    path?: unknown;
    projection?: unknown;
  }

  export const ComposableMap: React.ForwardRefExoticComponent<
    React.PropsWithChildren<{
      width?: number;
      height?: number;
      projection?: string;
      projectionConfig?: Record<string, unknown>;
      className?: string;
    }> &
      React.RefAttributes<SVGSVGElement>
  >;

  export const Geographies: React.FC<{
    geography: string | object;
    parseGeographies?: (geos: PreparedGeography[]) => PreparedGeography[];
    children: (props: GeographiesRenderArgs) => React.ReactNode;
    className?: string;
  }>;

  export const Geography: React.FC<{
    geography: PreparedGeography;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onClick?: (e: React.MouseEvent<SVGPathElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<SVGPathElement>) => void;
    className?: string;
    "aria-label"?: string;
    role?: string;
    tabIndex?: number;
  }>;

  export const Marker: React.FC<{
    coordinates: [number, number];
    children?: React.ReactNode;
    className?: string;
  }>;
}
