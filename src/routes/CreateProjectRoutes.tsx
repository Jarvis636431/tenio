import { Navigate, Route } from "react-router-dom";
import { UploadStep } from "@/components/create-project/UploadStep";
import { ConfirmStep } from "@/components/create-project/ConfirmStep";
import { SelectionStep } from "@/components/create-project/SelectionStep";
import { PreviewStep } from "@/components/create-project/PreviewStep";

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
