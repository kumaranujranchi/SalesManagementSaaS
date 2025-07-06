// Health check function
exports.handler = async (event, context) => {
  console.log('Health check called');
  
  const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: !!databaseUrl,
      databaseSource: process.env.DATABASE_URL ? 'DATABASE_URL' : 'NETLIFY_DATABASE_URL',
      sessionSecret: !!process.env.SESSION_SECRET,
    }),
  };
};
