
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { type CreateSurveyPointInput } from '../schema';
import { deleteSurveyPoint } from '../handlers/delete_survey_point';
import { eq } from 'drizzle-orm';

// Test survey point data
const testSurveyPoint: CreateSurveyPointInput = {
  latitude: 40.7128,
  longitude: -74.0060,
  location_name: 'Central Park Survey Point',
  description: 'Survey point near the lake',
  survey_date: new Date('2024-01-15')
};

describe('deleteSurveyPoint', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing survey point and return true', async () => {
    // Create a survey point first
    const insertResult = await db.insert(surveyPointsTable)
      .values({
        latitude: testSurveyPoint.latitude,
        longitude: testSurveyPoint.longitude,
        location_name: testSurveyPoint.location_name,
        description: testSurveyPoint.description,
        survey_date: testSurveyPoint.survey_date
      })
      .returning({ id: surveyPointsTable.id })
      .execute();

    const surveyPointId = insertResult[0].id;

    // Delete the survey point
    const result = await deleteSurveyPoint(surveyPointId);

    expect(result).toBe(true);

    // Verify the survey point was actually deleted
    const surveyPoints = await db.select()
      .from(surveyPointsTable)
      .where(eq(surveyPointsTable.id, surveyPointId))
      .execute();

    expect(surveyPoints).toHaveLength(0);
  });

  it('should return false when survey point does not exist', async () => {
    const nonExistentId = 99999;

    const result = await deleteSurveyPoint(nonExistentId);

    expect(result).toBe(false);
  });

  it('should not affect other survey points when deleting one', async () => {
    // Create two survey points
    const insertResults = await db.insert(surveyPointsTable)
      .values([
        {
          latitude: testSurveyPoint.latitude,
          longitude: testSurveyPoint.longitude,
          location_name: testSurveyPoint.location_name,
          description: testSurveyPoint.description,
          survey_date: testSurveyPoint.survey_date
        },
        {
          latitude: 41.8781,
          longitude: -87.6298,
          location_name: 'Chicago Survey Point',
          description: 'Survey point downtown',
          survey_date: new Date('2024-01-16')
        }
      ])
      .returning({ id: surveyPointsTable.id })
      .execute();

    const firstId = insertResults[0].id;
    const secondId = insertResults[1].id;

    // Delete the first survey point
    const result = await deleteSurveyPoint(firstId);

    expect(result).toBe(true);

    // Verify first point is deleted
    const deletedPoint = await db.select()
      .from(surveyPointsTable)
      .where(eq(surveyPointsTable.id, firstId))
      .execute();

    expect(deletedPoint).toHaveLength(0);

    // Verify second point still exists
    const remainingPoint = await db.select()
      .from(surveyPointsTable)
      .where(eq(surveyPointsTable.id, secondId))
      .execute();

    expect(remainingPoint).toHaveLength(1);
    expect(remainingPoint[0].location_name).toEqual('Chicago Survey Point');
  });
});
