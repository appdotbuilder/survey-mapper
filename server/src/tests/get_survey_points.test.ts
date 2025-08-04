
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { type GetSurveyPointsInput, getSurveyPointsInputSchema } from '../schema';
import { getSurveyPoints } from '../handlers/get_survey_points';

// Test survey point data
const testSurveyPoints = [
  {
    latitude: 40.7128,
    longitude: -74.0060,
    location_name: 'Central Park',
    description: 'Beautiful park in Manhattan',
    survey_date: new Date('2024-01-15')
  },
  {
    latitude: 34.0522,
    longitude: -118.2437,
    location_name: 'Downtown LA',
    description: 'Urban center of Los Angeles',
    survey_date: new Date('2024-01-16')
  },
  {
    latitude: 41.8781,
    longitude: -87.6298,
    location_name: 'Chicago Loop',
    description: null, // Test null description
    survey_date: new Date('2024-01-17')
  }
];

describe('getSurveyPoints', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all survey points with default pagination', async () => {
    // Insert test data
    await db.insert(surveyPointsTable).values(testSurveyPoints).execute();

    // Parse empty input to apply Zod defaults
    const input = getSurveyPointsInputSchema.parse({});
    const result = await getSurveyPoints(input);

    expect(result).toHaveLength(3);
    expect(result[0].location_name).toEqual('Central Park');
    expect(result[0].latitude).toEqual(40.7128);
    expect(result[0].longitude).toEqual(-74.0060);
    expect(result[0].description).toEqual('Beautiful park in Manhattan');
    expect(result[0].survey_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should handle pagination correctly', async () => {
    // Insert test data
    await db.insert(surveyPointsTable).values(testSurveyPoints).execute();

    // Test limit
    const limitInput = getSurveyPointsInputSchema.parse({ limit: 2 });
    const limitResult = await getSurveyPoints(limitInput);
    expect(limitResult).toHaveLength(2);

    // Test offset
    const offsetInput = getSurveyPointsInputSchema.parse({ limit: 2, offset: 1 });
    const offsetResult = await getSurveyPoints(offsetInput);
    expect(offsetResult).toHaveLength(2);
    expect(offsetResult[0].location_name).not.toEqual(limitResult[0].location_name);
  });

  it('should search by location name', async () => {
    // Insert test data
    await db.insert(surveyPointsTable).values(testSurveyPoints).execute();

    const input = getSurveyPointsInputSchema.parse({ search: 'park' });
    const result = await getSurveyPoints(input);

    expect(result).toHaveLength(1);
    expect(result[0].location_name).toEqual('Central Park');
  });

  it('should search by description', async () => {
    // Insert test data
    await db.insert(surveyPointsTable).values(testSurveyPoints).execute();

    const input = getSurveyPointsInputSchema.parse({ search: 'urban' });
    const result = await getSurveyPoints(input);

    expect(result).toHaveLength(1);
    expect(result[0].location_name).toEqual('Downtown LA');
    expect(result[0].description).toEqual('Urban center of Los Angeles');
  });

  it('should handle case-insensitive search', async () => {
    // Insert test data
    await db.insert(surveyPointsTable).values(testSurveyPoints).execute();

    const input = getSurveyPointsInputSchema.parse({ search: 'PARK' });
    const result = await getSurveyPoints(input);

    expect(result).toHaveLength(1);
    expect(result[0].location_name).toEqual('Central Park');
  });

  it('should return empty array when no matches found', async () => {
    // Insert test data
    await db.insert(surveyPointsTable).values(testSurveyPoints).execute();

    const input = getSurveyPointsInputSchema.parse({ search: 'nonexistent' });
    const result = await getSurveyPoints(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no data exists', async () => {
    const input = getSurveyPointsInputSchema.parse({});
    const result = await getSurveyPoints(input);

    expect(result).toHaveLength(0);
  });

  it('should handle null descriptions in search', async () => {
    // Insert test data
    await db.insert(surveyPointsTable).values(testSurveyPoints).execute();

    const input = getSurveyPointsInputSchema.parse({ search: 'loop' });
    const result = await getSurveyPoints(input);

    expect(result).toHaveLength(1);
    expect(result[0].location_name).toEqual('Chicago Loop');
    expect(result[0].description).toBeNull();
  });
});
