import { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

type LngLat = { getLng: () => number; getLat: () => number };
type MapClickEvent = { lnglat: LngLat };
type MapInstance = {
  addControl: (control: unknown) => void;
  on: (event: "click", handler: (event: MapClickEvent) => void) => void;
  off: (event: "click", handler: (event: MapClickEvent) => void) => void;
  add: (overlay: unknown) => void;
  remove: (overlay: unknown) => void;
  setCenter: (position: [number, number]) => void;
  destroy: () => void;
};
type MarkerInstance = {
  setPosition: (position: [number, number]) => void;
};
type AMapNamespace = {
  Map: new (
    container: HTMLDivElement,
    options: { viewMode: string; zoom: number; center: [number, number] },
  ) => MapInstance;
  Scale: new () => unknown;
  ToolBar: new () => unknown;
  Marker: new (options: { position: [number, number] }) => MarkerInstance;
};

interface MapContainerProps {
  className?: string;
  center?: [number, number]; // [经度, 纬度]
  zoom?: number;
  selectedPosition?: [number, number] | null;
  onSelect?: (position: [number, number]) => void;
}

export function MapContainer({
  className = "w-full h-full",
  center = [116.397428, 39.90923], // 默认北京天安门
  zoom = 11,
  selectedPosition = null,
  onSelect,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapInstance | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const markerRef = useRef<MarkerInstance | null>(null);

  useEffect(() => {
    let map: MapInstance | null = null;
    let clickHandler: ((event: MapClickEvent) => void) | null = null;
    // 1. 配置安全密钥 (必须在 loader 加载前配置)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)._AMapSecurityConfig = {
      securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
    };

    // 2. 加载地图 API
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY, // 申请好的 Web 端开发者 Key
      version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      plugins: ["AMap.Scale", "AMap.ToolBar"], // 需要使用的插件列表
    })
      .then((AMap) => {
        if (!mapRef.current) return;
        amapRef.current = AMap as AMapNamespace;

        // 3. 初始化地图
        map = new AMap.Map(mapRef.current, {
          viewMode: "3D", // 是否为 3D 地图模式
          zoom: zoom, // 初始化地图级别
          center: center, // 初始化地图中心点位置
        });

        // 添加插件
        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar());

        setMapInstance(map);

        const handleClick = (event: MapClickEvent) => {
          if (!onSelect) return;
          const position: [number, number] = [
            event.lnglat.getLng(),
            event.lnglat.getLat(),
          ];
          onSelect(position);
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

  return <div ref={mapRef} className={className} />;
}
