import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UploadPage } from "@/features/upload";

describe("UploadPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("allows Word files for bill of quantities uploads", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <UploadPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const input = screen.getByLabelText("选择工程量清单文件");

    expect(input).toHaveAttribute("accept", ".xls,.xlsx,.doc,.docx,.pdf");
    expect(screen.getByText("支持 .xls .xlsx .doc .docx .pdf，最多 3 个文件")).toBeInTheDocument();
  });
});
