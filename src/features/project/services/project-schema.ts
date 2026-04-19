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

const costCurvePointSchema = z.object({
  date: z.string(),
  material_cost: z.number().optional(),
  floating_cost: z.number().optional(),
  total_cost: z.number(),
});

const headcountCurvePointSchema = z.object({
  date: z.string(),
  headcount: z.number(),
});

export const costCurveResponseSchema = z.object({
  id: z.string().optional(),
  project_id: z.string().min(1),
  start_date: z.string().optional(),
  days: z.array(z.number()),
  dates: z.array(z.string()),
  total_costs: z.array(z.number()),
  material_costs: z.array(z.number()).optional(),
  floating_costs: z.array(z.number()).optional(),
  created_at: z.string().optional(),
  generated_at: z.string().optional(),
});

export const legacyCostCurveResponseSchema = z.object({
  project_id: z.string().min(1),
  points: z.array(costCurvePointSchema),
  generated_at: z.string().optional(),
});

export const headcountCurveResponseSchema = z.object({
  id: z.string().optional(),
  project_id: z.string().min(1),
  start_date: z.string().optional(),
  days: z.array(z.number()),
  dates: z.array(z.string()),
  headcounts: z.array(z.number()),
  created_at: z.string().optional(),
  generated_at: z.string().optional(),
});

export const legacyHeadcountCurveResponseSchema = z.object({
  project_id: z.string().min(1),
  points: z.array(headcountCurvePointSchema),
  generated_at: z.string().optional(),
});
