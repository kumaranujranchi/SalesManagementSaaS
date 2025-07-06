// Simple test function to verify Netlify functions work
exports.handler = async (event, context) => {
  console.log('Test function called:', event.httpMethod, event.path);
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NETLIFY_DATABASE_URL: !!process.env.NETLIFY_DATABASE_URL,
    NETLIFY_DATABASE_URL_UNPOOLED: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
    SESSION_SECRET: !!process.env.SESSION_SECRET,
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify({
      message: 'Netlify function is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasDatabase: !!(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL),
      hasSessionSecret: !!process.env.SESSION_SECRET,
    }),
  };
};
