import AMapLoader from "@amap/amap-jsapi-loader";
import type { AMapNamespace } from "@/types/map";
import { AMAP } from "@/config";

export async function loadAMap(plugins: string[]) {
  (window as any)._AMapSecurityConfig = {
    securityJsCode: AMAP.securityCode,
  };

  return AMapLoader.load({
    key: AMAP.key,
    version: "2.0",
    plugins,
  }) as Promise<AMapNamespace>;
}
