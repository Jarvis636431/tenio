import { useEffect, useRef, useState } from "react";
import { loadAMap } from "@/components/map";
import type {
  AMapNamespace,
  GeocoderInstance,
  MapClickEvent,
  MapInstance,
  MarkerInstance,
} from "@/types/map";

interface MapContainerProps {
  className?: string;
  center?: [number, number]; // [经度, 纬度]
  zoom?: number;
  selectedPosition?: [number, number] | null;
  onSelect?: (position: [number, number]) => void;
  searchQuery?: string;
  searchCity?: string;
  searchToken?: number;
}

export function MapContainer({
  className = "w-full h-full",
  center = [116.397428, 39.90923], // 默认北京天安门
  zoom = 11,
  selectedPosition = null,
  onSelect,
  searchQuery,
  searchCity,
  searchToken,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapInstance | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const markerRef = useRef<MarkerInstance | null>(null);
  const geocoderRef = useRef<GeocoderInstance | null>(null);
  const onSelectRef = useRef(onSelect);
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let map: MapInstance | null = null;
    let clickHandler: ((event: MapClickEvent) => void) | null = null;
    loadAMap(["AMap.Scale", "AMap.ToolBar", "AMap.Geocoder"])
      .then((AMap) => {
        if (!mapRef.current) return;
        amapRef.current = AMap as AMapNamespace;

        // 3. 初始化地图
        map = new AMap.Map(mapRef.current, {
          viewMode: "3D", // 是否为 3D 地图模式
          zoom: initialZoomRef.current, // 初始化地图级别
          center: initialCenterRef.current, // 初始化地图中心点位置
        });

        // 添加插件
        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar());

        setMapInstance(map);

        const handleClick = (event: MapClickEvent) => {
          if (!onSelectRef.current) return;
          const position: [number, number] = [event.lnglat.getLng(), event.lnglat.getLat()];
          onSelectRef.current(position);
        };

        clickHandler = handleClick;
        map.on("click", handleClick);
      })
      .catch((e) => {
        console.error("高德地图加载失败:", e);
      });

    // 4. 清理函数：组件卸载时销毁地图实例
    return () => {
      if (map) {
        if (clickHandler) {
          map.off("click", clickHandler);
        }
        map.destroy();
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, []); // 空依赖数组，确保只初始化一次

  useEffect(() => {
    if (!mapInstance) return;
    if (!selectedPosition) {
      if (markerRef.current) {
        mapInstance.remove(markerRef.current);
        markerRef.current = null;
      }
      return;
    }
    const AMap = amapRef.current;
    if (!AMap) return;
    if (!markerRef.current) {
      markerRef.current = new AMap.Marker({ position: selectedPosition });
      mapInstance.add(markerRef.current);
    } else {
      markerRef.current.setPosition(selectedPosition);
    }
    mapInstance.setCenter(selectedPosition);
  }, [mapInstance, selectedPosition]);

  useEffect(() => {
    if (!mapInstance || !searchToken) return;
    const AMap = amapRef.current;
    if (!AMap || !searchQuery?.trim()) return;
    if (!geocoderRef.current) {
      geocoderRef.current = new AMap.Geocoder({ city: searchCity });
    }
    const resolvedQuery = searchCity ? `${searchCity}${searchQuery}` : searchQuery;
    geocoderRef.current.getLocation(resolvedQuery, (status, result) => {
      if (status === "complete" && result.geocodes?.length) {
        const location = result.geocodes[0].location;
        const position: [number, number] = [location.lng, location.lat];
        onSelect?.(position);
      }
    });
  }, [mapInstance, searchToken, searchQuery, searchCity, onSelect]);

  return <div ref={mapRef} className={className} />;
}
