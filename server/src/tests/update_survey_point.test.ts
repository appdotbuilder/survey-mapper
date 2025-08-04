
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surveyPointsTable } from '../db/schema';
import { type CreateSurveyPointInput, type UpdateSurveyPointInput } from '../schema';
import { updateSurveyPoint } from '../handlers/update_survey_point';
import { eq } from 'drizzle-orm';

// Helper function to create a test survey point
const createTestSurveyPoint = async () => {
  const testInput: CreateSurveyPointInput = {
    latitude: 40.7128,
    longitude: -74.0060,
    location_name: 'Original Location',
    description: 'Original description',
    survey_date: new Date('2024-01-01')
  };

  const result = await db.insert(surveyPointsTable)
    .values(testInput)
    .returning()
    .execute();

  return result[0];
};

describe('updateSurveyPoint', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a survey point', async () => {
    const originalPoint = await createTestSurveyPoint();

    const updateInput: UpdateSurveyPointInput = {
      id: originalPoint.id,
      latitude: 34.0522,
      longitude: -118.2437,
      location_name: 'Updated Location',
      description: 'Updated description',
      survey_date: new Date('2024-02-01')
    };

    const result = await updateSurveyPoint(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(originalPoint.id);
    expect(result!.latitude).toEqual(34.0522);
    expect(result!.longitude).toEqual(-118.2437);
    expect(result!.location_name).toEqual('Updated Location');
    expect(result!.description).toEqual('Updated description');
    expect(result!.survey_date).toEqual(new Date('2024-02-01'));
    expect(result!.created_at).toEqual(originalPoint.created_at);
  });

  it('should update only specified fields', async () => {
    const originalPoint = await createTestSurveyPoint();

    const updateInput: UpdateSurveyPointInput = {
      id: originalPoint.id,
      location_name: 'Partially Updated Location'
    };

    const result = await updateSurveyPoint(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(originalPoint.id);
    expect(result!.latitude).toEqual(originalPoint.latitude);
    expect(result!.longitude).toEqual(originalPoint.longitude);
    expect(result!.location_name).toEqual('Partially Updated Location');
    expect(result!.description).toEqual(originalPoint.description);
    expect(result!.survey_date).toEqual(originalPoint.survey_date);
  });

  it('should save updates to database', async () => {
    const originalPoint = await createTestSurveyPoint();

    const updateInput: UpdateSurveyPointInput = {
      id: originalPoint.id,
      location_name: 'Database Test Location',
      latitude: 51.5074
    };

    await updateSurveyPoint(updateInput);

    // Verify the changes were persisted
    const updatedPoints = await db.select()
      .from(surveyPointsTable)
      .where(eq(surveyPointsTable.id, originalPoint.id))
      .execute();

    expect(updatedPoints).toHaveLength(1);
    expect(updatedPoints[0].location_name).toEqual('Database Test Location');
    expect(updatedPoints[0].latitude).toEqual(51.5074);
    expect(updatedPoints[0].longitude).toEqual(originalPoint.longitude); // Unchanged
  });

  it('should return null for non-existent survey point', async () => {
    const updateInput: UpdateSurveyPointInput = {
      id: 99999, // Non-existent ID
      location_name: 'This should not work'
    };

    const result = await updateSurveyPoint(updateInput);

    expect(result).toBeNull();
  });

  it('should handle empty update gracefully', async () => {
    const originalPoint = await createTestSurveyPoint();

    const updateInput: UpdateSurveyPointInput = {
      id: originalPoint.id
      // No update fields provided
    };

    const result = await updateSurveyPoint(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(originalPoint.id);
    expect(result!.location_name).toEqual(originalPoint.location_name);
    expect(result!.latitude).toEqual(originalPoint.latitude);
  });

  it('should update description to null', async () => {
    const originalPoint = await createTestSurveyPoint();

    const updateInput: UpdateSurveyPointInput = {
      id: originalPoint.id,
      description: null
    };

    const result = await updateSurveyPoint(updateInput);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
  });

  it('should handle coordinate boundary values', async () => {
    const originalPoint = await createTestSurveyPoint();

    const updateInput: UpdateSurveyPointInput = {
      id: originalPoint.id,
      latitude: -90,
      longitude: 180
    };

    const result = await updateSurveyPoint(updateInput);

    expect(result).not.toBeNull();
    expect(result!.latitude).toEqual(-90);
    expect(result!.longitude).toEqual(180);
  });
});
