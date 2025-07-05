// Netlify Function to handle all API routes
const serverlessExpress = require('@vendia/serverless-express');

// For Netlify Functions, we need to use CommonJS
const createHandler = async () => {
  try {
    // Import the built server
    const { default: app } = await import('../../dist/index.js');
    return serverlessExpress({ app });
  } catch (error) {
    console.error('Failed to import server app:', error);
    // Return a basic error handler
    return (event, context) => {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server initialization failed' })
      };
    };
  }
};

// Export the handler
exports.handler = async (event, context) => {
  const handler = await createHandler();
  return handler(event, context);
};
