
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { type CreateSurveyPointInput } from '../schema';
import { createSurveyPoint } from '../handlers/create_survey_point';
import { eq } from 'drizzle-orm';

// Test input with valid coordinates
const testInput: CreateSurveyPointInput = {
  latitude: 40.7128,
  longitude: -74.0060,
  location_name: 'Test Location NYC',
  description: 'A test survey point in New York City',
  survey_date: new Date('2024-01-15T10:30:00Z')
};

describe('createSurveyPoint', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a survey point', async () => {
    const result = await createSurveyPoint(testInput);

    // Basic field validation
    expect(result.latitude).toEqual(40.7128);
    expect(result.longitude).toEqual(-74.0060);
    expect(result.location_name).toEqual('Test Location NYC');
    expect(result.description).toEqual('A test survey point in New York City');
    expect(result.survey_date).toEqual(testInput.survey_date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save survey point to database', async () => {
    const result = await createSurveyPoint(testInput);

    // Query the database to verify the record was saved
    const surveyPoints = await db.select()
      .from(surveyPointsTable)
      .where(eq(surveyPointsTable.id, result.id))
      .execute();

    expect(surveyPoints).toHaveLength(1);
    expect(surveyPoints[0].latitude).toEqual(40.7128);
    expect(surveyPoints[0].longitude).toEqual(-74.0060);
    expect(surveyPoints[0].location_name).toEqual('Test Location NYC');
    expect(surveyPoints[0].description).toEqual('A test survey point in New York City');
    expect(surveyPoints[0].survey_date).toEqual(testInput.survey_date);
    expect(surveyPoints[0].created_at).toBeInstanceOf(Date);
  });

  it('should create survey point with null description', async () => {
    const inputWithNullDescription: CreateSurveyPointInput = {
      ...testInput,
      description: null
    };

    const result = await createSurveyPoint(inputWithNullDescription);

    expect(result.description).toBeNull();

    // Verify in database
    const surveyPoints = await db.select()
      .from(surveyPointsTable)
      .where(eq(surveyPointsTable.id, result.id))
      .execute();

    expect(surveyPoints[0].description).toBeNull();
  });

  it('should handle coordinate boundary values', async () => {
    const boundaryInput: CreateSurveyPointInput = {
      latitude: 90, // Maximum latitude
      longitude: -180, // Minimum longitude
      location_name: 'North Pole Test',
      description: 'Testing boundary coordinates',
      survey_date: new Date('2024-01-01T00:00:00Z')
    };

    const result = await createSurveyPoint(boundaryInput);

    expect(result.latitude).toEqual(90);
    expect(result.longitude).toEqual(-180);
    expect(result.location_name).toEqual('North Pole Test');
  });
});
