import { http, HttpResponse } from "msw";

export const handlers = [
  // 拦截 GET /api/projects 请求
  http.get("/api/projects", () => {
    return HttpResponse.json([
      {
        id: "1",
        name: "Mock Project A",
        city: "Beijing",
        status: "active",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Mock Project B",
        city: "Shanghai",
        status: "planning",
        createdAt: new Date().toISOString(),
      },
    ]);
  }),

  // 你可以在这里继续添加其他接口的拦截规则
];
