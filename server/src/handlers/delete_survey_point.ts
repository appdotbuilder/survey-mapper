
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteSurveyPoint = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(surveyPointsTable)
      .where(eq(surveyPointsTable.id, id))
      .returning({ id: surveyPointsTable.id })
      .execute();

    // Return true if a record was deleted, false if not found
    return result.length > 0;
  } catch (error) {
    console.error('Survey point deletion failed:', error);
    throw error;
  }
};
