
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { type GetSurveyPointsInput, type SurveyPoint } from '../schema';
import { or, ilike } from 'drizzle-orm';

export async function getSurveyPoints(input: GetSurveyPointsInput): Promise<SurveyPoint[]> {
  try {
    // Handle search with or without filters
    if (input.search) {
      const searchTerm = `%${input.search}%`;
      const results = await db.select()
        .from(surveyPointsTable)
        .where(
          or(
            ilike(surveyPointsTable.location_name, searchTerm),
            ilike(surveyPointsTable.description, searchTerm)
          )
        )
        .limit(input.limit)
        .offset(input.offset)
        .execute();
      
      return results;
    } else {
      // No search filter - just pagination
      const results = await db.select()
        .from(surveyPointsTable)
        .limit(input.limit)
        .offset(input.offset)
        .execute();
      
      return results;
    }
  } catch (error) {
    console.error('Get survey points failed:', error);
    throw error;
  }
}
