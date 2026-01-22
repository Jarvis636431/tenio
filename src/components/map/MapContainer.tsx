import { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

interface MapContainerProps {
  className?: string;
  center?: [number, number]; // [经度, 纬度]
  zoom?: number;
}

export function MapContainer({
  className = "w-full h-full",
  center = [116.397428, 39.90923], // 默认北京天安门
  zoom = 11,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
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

        // 3. 初始化地图
        const map = new AMap.Map(mapRef.current, {
          viewMode: "3D", // 是否为 3D 地图模式
          zoom: zoom, // 初始化地图级别
          center: center, // 初始化地图中心点位置
        });

        // 添加插件
        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar());

        setMapInstance(map);
      })
      .catch((e) => {
        console.error("高德地图加载失败:", e);
      });

    // 4. 清理函数：组件卸载时销毁地图实例
    return () => {
      if (mapInstance) {
        mapInstance.destroy();
        setMapInstance(null);
      }
    };
  }, []); // 空依赖数组，确保只初始化一次

  return <div ref={mapRef} className={className} />;
}
