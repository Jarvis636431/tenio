import { AgentService } from "../src/modules/agent/agent.service.js";

describe("Agent stream protocol", () => {
  it("sends cumulative message content expected by the frontend", () => {
    const service = Object.create(AgentService.prototype) as AgentService;
    const events = service["createStreamEvents"]("第一段\n第二段", { kind: "none" });

    expect(events).toEqual([
      { type: "message.delta", content: "第一段" },
      { type: "message.delta", content: "第一段\n第二段" },
    ]);
  });
});
