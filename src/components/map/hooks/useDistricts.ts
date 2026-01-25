import { useEffect, useMemo, useState } from "react";
import { loadAMap } from "@/components/map/utils/amap";

type DistrictNode = {
  name?: string;
  adcode?: string | number;
  districtList?: DistrictNode[];
};

export function useDistricts() {
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [citiesByProvince, setCitiesByProvince] = useState<
    Record<string, string[]>
  >({});

  const cityOptions = useMemo(
    () => citiesByProvince[province] ?? [],
    [citiesByProvince, province],
  );

  useEffect(() => {
    let active = true;

    loadAMap(["AMap.DistrictSearch"])
      .then((AMap) => {
        if (!active) return;
        const districtSearch = new AMap.DistrictSearch({
          level: "country",
          subdistrict: 1,
          extensions: "base",
        });

        districtSearch.search("中国", (status, result) => {
          if (!active || status !== "complete") return;
          const list =
            (result?.districtList?.[0]?.districtList as DistrictNode[]) ?? [];
          const provinceNames = list
            .filter((item) => item?.name && item?.adcode)
            .sort((a, b) => Number(a.adcode) - Number(b.adcode))
            .map((item) => item.name as string);
          setProvinces(provinceNames);
          if (!province && provinceNames.length > 0) {
            setProvince(provinceNames[0]);
          }
        });
      })
      .catch((error) => {
        console.error("高德行政区数据加载失败:", error);
      });

    return () => {
      active = false;
    };
  }, [province]);

  useEffect(() => {
    if (!province) return;
    let active = true;

    loadAMap(["AMap.DistrictSearch"])
      .then((AMap) => {
        if (!active) return;
        const districtSearch = new AMap.DistrictSearch({
          level: "province",
          subdistrict: 1,
          extensions: "base",
        });
        districtSearch.search(province, (status, result) => {
          if (!active || status !== "complete") return;
          const list =
            (result?.districtList?.[0]?.districtList as DistrictNode[]) ?? [];
          const cityNames = list
            .filter((item) => item?.name && item?.adcode)
            .sort((a, b) => Number(a.adcode) - Number(b.adcode))
            .map((item) => item.name as string);
          setCitiesByProvince((prev) => ({
            ...prev,
            [province]: cityNames,
          }));
          if (cityNames.length > 0 && !cityNames.includes(city)) {
            setCity(cityNames[0]);
          }
        });
      })
      .catch((error) => {
        console.error("高德城市数据加载失败:", error);
      });

    return () => {
      active = false;
    };
  }, [province, city]);

  return {
    province,
    setProvince,
    city,
    setCity,
    provinces,
    citiesByProvince,
    cityOptions,
  };
}
