let handler;

exports.handler = async (event, context) => {
  try {
    console.log('Function invoked with event:', JSON.stringify(event, null, 2));
    
    if (!handler) {
      console.log('Creating serverless handler...');
      
      const serverlessExpress = await import("@vendia/serverless-express");
      const appModule = await import("../../dist/index.js");
      
      console.log('Modules imported successfully');
      console.log('serverlessExpress:', typeof serverlessExpress);
      console.log('appModule:', typeof appModule, Object.keys(appModule));
      
      const app = appModule.default || appModule;
      
      if (!app) {
        console.error('App is undefined or null');
        throw new Error("No default export found in app module");
      }
      
      console.log('App loaded successfully, type:', typeof app);
      handler = serverlessExpress.default ? serverlessExpress.default({ app }) : serverlessExpress({ app });
    }
    
    console.log('Calling handler...');
    const result = await handler(event, context);
    console.log('Handler result:', result);
    return result;
    
  } catch (error) {
    console.error('Function error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
