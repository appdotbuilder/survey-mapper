
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { type CreateSurveyPointInput } from '../schema';
import { getSurveyPointById } from '../handlers/get_survey_point_by_id';

// Test survey point data
const testSurveyPoint: CreateSurveyPointInput = {
  latitude: 40.7128,
  longitude: -74.0060,
  location_name: 'Central Park Survey Point',
  description: 'Survey point located in Central Park for environmental monitoring',
  survey_date: new Date('2024-01-15')
};

describe('getSurveyPointById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return survey point when found', async () => {
    // Create a survey point
    const insertResult = await db.insert(surveyPointsTable)
      .values({
        latitude: testSurveyPoint.latitude,
        longitude: testSurveyPoint.longitude,
        location_name: testSurveyPoint.location_name,
        description: testSurveyPoint.description,
        survey_date: testSurveyPoint.survey_date
      })
      .returning()
      .execute();

    const createdSurveyPoint = insertResult[0];

    // Fetch the survey point by ID
    const result = await getSurveyPointById(createdSurveyPoint.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdSurveyPoint.id);
    expect(result!.latitude).toBe(40.7128);
    expect(result!.longitude).toBe(-74.0060);
    expect(result!.location_name).toBe('Central Park Survey Point');
    expect(result!.description).toBe('Survey point located in Central Park for environmental monitoring');
    expect(result!.survey_date).toBeInstanceOf(Date);
    expect(result!.survey_date.getTime()).toBe(new Date('2024-01-15').getTime());
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when survey point not found', async () => {
    const result = await getSurveyPointById(999999);
    expect(result).toBeNull();
  });

  it('should handle survey point with null description', async () => {
    // Create survey point with null description
    const insertResult = await db.insert(surveyPointsTable)
      .values({
        latitude: 35.6762,
        longitude: 139.6503,
        location_name: 'Tokyo Survey Point',
        description: null,
        survey_date: new Date('2024-02-20')
      })
      .returning()
      .execute();

    const createdSurveyPoint = insertResult[0];

    // Fetch the survey point
    const result = await getSurveyPointById(createdSurveyPoint.id);

    // Verify null description is handled correctly
    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.location_name).toBe('Tokyo Survey Point');
    expect(result!.latitude).toBe(35.6762);
    expect(result!.longitude).toBe(139.6503);
  });

  it('should return correct data types', async () => {
    // Create a survey point
    const insertResult = await db.insert(surveyPointsTable)
      .values({
        latitude: -33.8688,
        longitude: 151.2093,
        location_name: 'Sydney Survey Point',
        description: 'Harbor area survey point',
        survey_date: new Date('2024-03-10')
      })
      .returning()
      .execute();

    const createdSurveyPoint = insertResult[0];

    // Fetch and verify data types
    const result = await getSurveyPointById(createdSurveyPoint.id);

    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.latitude).toBe('number');
    expect(typeof result!.longitude).toBe('number');
    expect(typeof result!.location_name).toBe('string');
    expect(typeof result!.description).toBe('string');
    expect(result!.survey_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });
});
