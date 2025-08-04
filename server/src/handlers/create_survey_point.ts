
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { type CreateSurveyPointInput, type SurveyPoint } from '../schema';

export const createSurveyPoint = async (input: CreateSurveyPointInput): Promise<SurveyPoint> => {
  try {
    // Insert survey point record
    const result = await db.insert(surveyPointsTable)
      .values({
        latitude: input.latitude,
        longitude: input.longitude,
        location_name: input.location_name,
        description: input.description,
        survey_date: input.survey_date
      })
      .returning()
      .execute();

    // Return the created survey point
    const surveyPoint = result[0];
    return surveyPoint;
  } catch (error) {
    console.error('Survey point creation failed:', error);
    throw error;
  }
};
