import { z } from "zod";

export const projectListItemSchema = z.object({
  project_id: z.string().min(1),
  project_name: z.string().min(1),
  description: z.string().optional(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const projectListResponseSchema = z.array(projectListItemSchema);
