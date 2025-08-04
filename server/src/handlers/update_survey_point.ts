
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { type UpdateSurveyPointInput, type SurveyPoint } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateSurveyPoint(input: UpdateSurveyPointInput): Promise<SurveyPoint | null> {
  try {
    // Extract ID and update fields
    const { id, ...updateFields } = input;

    // Check if survey point exists
    const existingPoints = await db.select()
      .from(surveyPointsTable)
      .where(eq(surveyPointsTable.id, id))
      .execute();

    if (existingPoints.length === 0) {
      return null;
    }

    // Only update if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      return existingPoints[0];
    }

    // Update the survey point
    const result = await db.update(surveyPointsTable)
      .set(updateFields)
      .where(eq(surveyPointsTable.id, id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Survey point update failed:', error);
    throw error;
  }
}
