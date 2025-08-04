
import { z } from 'zod';

// Survey point schema
export const surveyPointSchema = z.object({
  id: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  location_name: z.string(),
  description: z.string().nullable(),
  survey_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type SurveyPoint = z.infer<typeof surveyPointSchema>;

// Input schema for creating survey points
export const createSurveyPointInputSchema = z.object({
  latitude: z.number().min(-90).max(90), // Valid latitude range
  longitude: z.number().min(-180).max(180), // Valid longitude range
  location_name: z.string().min(1).max(255),
  description: z.string().nullable(),
  survey_date: z.coerce.date()
});

export type CreateSurveyPointInput = z.infer<typeof createSurveyPointInputSchema>;

// Input schema for updating survey points
export const updateSurveyPointInputSchema = z.object({
  id: z.number(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location_name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  survey_date: z.coerce.date().optional()
});

export type UpdateSurveyPointInput = z.infer<typeof updateSurveyPointInputSchema>;

// Query schema for filtering survey points
export const getSurveyPointsInputSchema = z.object({
  limit: z.number().int().positive().max(1000).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
  search: z.string().optional() // Search by location name or description
});

export type GetSurveyPointsInput = z.infer<typeof getSurveyPointsInputSchema>;
