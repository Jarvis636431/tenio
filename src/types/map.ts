export type LngLat = { getLng: () => number; getLat: () => number };

export type MapClickEvent = { lnglat: LngLat };

export type MapInstance = {
  addControl: (control: unknown) => void;
  on: (event: "click", handler: (event: MapClickEvent) => void) => void;
  off: (event: "click", handler: (event: MapClickEvent) => void) => void;
  add: (overlay: unknown) => void;
  remove: (overlay: unknown) => void;
  setCenter: (position: [number, number]) => void;
  destroy: () => void;
};

export type MarkerInstance = {
  setPosition: (position: [number, number]) => void;
};

export type GeocoderInstance = {
  getLocation: (
    address: string,
    callback: (
      status: string,
      result: { geocodes?: { location: { lng: number; lat: number } }[] },
    ) => void,
  ) => void;
};

export type AMapNamespace = {
  Map: new (
    container: HTMLDivElement,
    options: { viewMode: string; zoom: number; center: [number, number] },
  ) => MapInstance;
  Scale: new () => unknown;
  ToolBar: new () => unknown;
  Marker: new (options: { position: [number, number] }) => MarkerInstance;
  Geocoder: new (options?: { city?: string }) => GeocoderInstance;
  DistrictSearch?: new (options: {
    level: string;
    subdistrict: number;
    extensions: string;
  }) => {
    search: (
      keyword: string,
      callback: (status: string, result: any) => void,
    ) => void;
  };
};

export type DistrictNode = {
  name?: string;
  adcode?: string | number;
  districtList?: DistrictNode[];
};
