import { requestJson } from "@/services/http";
import { API_BASE } from "@/config";
import type { PoiChatPayload, PoiChatResponse } from "@/types/domain/poi";

const POI_SERVICE_BASE_URL =
  (API_BASE as { poiService?: string }).poiService ??
  "https://chat.zrzz.site";

export async function postPoiChat(
  payload: PoiChatPayload,
): Promise<PoiChatResponse> {
  return requestJson<PoiChatResponse>(`${POI_SERVICE_BASE_URL}/api/poi/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
