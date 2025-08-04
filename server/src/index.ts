
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createSurveyPointInputSchema, 
  updateSurveyPointInputSchema,
  getSurveyPointsInputSchema 
} from './schema';

// Import handlers
import { createSurveyPoint } from './handlers/create_survey_point';
import { getSurveyPoints } from './handlers/get_survey_points';
import { getSurveyPointById } from './handlers/get_survey_point_by_id';
import { updateSurveyPoint } from './handlers/update_survey_point';
import { deleteSurveyPoint } from './handlers/delete_survey_point';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new survey point
  createSurveyPoint: publicProcedure
    .input(createSurveyPointInputSchema)
    .mutation(({ input }) => createSurveyPoint(input)),
  
  // Get survey points with optional pagination and search
  getSurveyPoints: publicProcedure
    .input(getSurveyPointsInputSchema)
    .query(({ input }) => getSurveyPoints(input)),
  
  // Get a single survey point by ID
  getSurveyPointById: publicProcedure
    .input(z.number())
    .query(({ input }) => getSurveyPointById(input)),
  
  // Update an existing survey point
  updateSurveyPoint: publicProcedure
    .input(updateSurveyPointInputSchema)
    .mutation(({ input }) => updateSurveyPoint(input)),
  
  // Delete a survey point
  deleteSurveyPoint: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteSurveyPoint(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Survey mapping TRPC server listening at port: ${port}`);
}

start();
