import AMapLoader from "@amap/amap-jsapi-loader";

type AMapNamespace = {
  DistrictSearch: new (options: {
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

export async function loadAMap(plugins: string[]) {
  (window as any)._AMapSecurityConfig = {
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
  };

  return AMapLoader.load({
    key: import.meta.env.VITE_AMAP_KEY,
    version: "2.0",
    plugins,
  }) as Promise<AMapNamespace>;
}
