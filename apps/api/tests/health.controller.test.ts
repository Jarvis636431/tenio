import { Test, type TestingModule } from "@nestjs/testing";
import { HealthController } from "../src/modules/health/health.controller.js";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it("should return health status", () => {
    const result = controller.getHealth();
    expect(result).toMatchObject({ status: "ok", service: "api" });
    expect(result).toHaveProperty("timestamp");
  });
});
