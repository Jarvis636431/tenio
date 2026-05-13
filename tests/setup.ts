import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
vi.stubEnv("VITE_AI_SERVICE_URL", "http://127.0.0.1:8123");
