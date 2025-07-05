// Netlify Function to handle all API routes
import serverlessExpress from '@vendia/serverless-express';
import app from '../../server/index.js';

// Create serverless handler
const handler = serverlessExpress({ app });

export { handler };
