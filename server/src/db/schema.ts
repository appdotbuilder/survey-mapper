
import { serial, text, pgTable, timestamp, real } from 'drizzle-orm/pg-core';

export const surveyPointsTable = pgTable('survey_points', {
  id: serial('id').primaryKey(),
  latitude: real('latitude').notNull(), // Real for precise coordinates
  longitude: real('longitude').notNull(), // Real for precise coordinates
  location_name: text('location_name').notNull(),
  description: text('description'), // Nullable by default
  survey_date: timestamp('survey_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type SurveyPoint = typeof surveyPointsTable.$inferSelect; // For SELECT operations
export type NewSurveyPoint = typeof surveyPointsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { surveyPoints: surveyPointsTable };
