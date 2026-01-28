import { Navigate, Route } from "react-router-dom";
import { UploadStep } from "@/pages/create/steps/UploadStep";
import { ConfirmStep } from "@/pages/create/steps/ConfirmStep";
import { SelectionStep } from "@/pages/create/steps/SelectionStep";
import { PreviewStep } from "@/pages/create/steps/PreviewStep";

export function CreateProjectRoutes() {
  return (
    <>
      <Route index element={<Navigate to="upload" replace />} />
      <Route path="upload" element={<UploadStep />} />
      <Route path="confirm" element={<ConfirmStep />} />
      <Route path="selection" element={<SelectionStep />} />
      <Route path="preview" element={<PreviewStep />} />
    </>
  );
}
