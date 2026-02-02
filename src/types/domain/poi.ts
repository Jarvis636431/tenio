export interface PoiItem {
  name: string;
  address: string;
  city: string;
  district: string;
  type: string;
  distance_m: number;
  lng: number;
  lat: number;
  poi_id: string;
  tel?: string;
  source_cell_lng?: number;
  source_cell_lat?: number;
  source_cell_radius_m?: number;
}

export interface BuildingInfo {
  buildingAreaM2: number;
  buildingFloors: number;
  buildingCount: number;
  structureType: string;
  region: string;
  seismicResistanceLevel: string;
}

export interface PoiChatPayload {
  poi_list: PoiItem[];
  building_info: BuildingInfo;
}

export interface PoiChatResponse {
  [key: string]: unknown;
}
