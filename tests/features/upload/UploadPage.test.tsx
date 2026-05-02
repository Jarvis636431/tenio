import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UploadPage } from "@/features/upload";

describe("UploadPage", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    queryClient.clear();
    container.remove();
  });

  it("allows Word files for bill of quantities uploads", () => {
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UploadPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    const input = container.querySelector<HTMLInputElement>(
      'input[aria-label="选择工程量清单文件"]',
    );

    expect(input).not.toBeNull();
    expect(input?.accept.split(",")).toEqual([".xls", ".xlsx", ".doc", ".docx", ".pdf"]);
    expect(container).toHaveTextContent("支持 .xls .xlsx .doc .docx .pdf，最多 3 个文件");
  });
});
