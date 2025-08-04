
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { type SurveyPoint } from '../schema';
import { eq } from 'drizzle-orm';

export const getSurveyPointById = async (id: number): Promise<SurveyPoint | null> => {
  try {
    const results = await db.select()
      .from(surveyPointsTable)
      .where(eq(surveyPointsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const surveyPoint = results[0];
    return {
      ...surveyPoint,
      // Convert dates to Date objects for consistency with schema
      survey_date: new Date(surveyPoint.survey_date),
      created_at: new Date(surveyPoint.created_at)
    };
  } catch (error) {
    console.error('Failed to fetch survey point by ID:', error);
    throw error;
  }
};
