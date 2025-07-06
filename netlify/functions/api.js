// Netlify Function to handle all API routes
import serverlessExpress from "@vendia/serverless-express";

// Create handler function
const createHandler = async () => {
  try {
    // Import the built server app
    const { default: app } = await import("../../dist/index.js");
    console.log("Successfully imported app:", !!app);
    return serverlessExpress({ app });
  } catch (error) {
    console.error("Failed to import server app:", error);
    console.error("Error details:", error.message);
    console.error("Stack:", error.stack);

    // Return a basic error handler
    return (event, context) => {
      console.error("Handler error - event:", JSON.stringify(event, null, 2));
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Server initialization failed",
          details: error.message,
          timestamp: new Date().toISOString(),
        }),
      };
    };
  }
};

// Export the handler
export const handler = async (event, context) => {
  console.log("Netlify function called:", event.httpMethod, event.path);
  console.log("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NETLIFY_DATABASE_URL: !!process.env.NETLIFY_DATABASE_URL,
    NETLIFY_DATABASE_URL_UNPOOLED: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
    SESSION_SECRET: !!process.env.SESSION_SECRET,
  });

  try {
    const handlerFunc = await createHandler();
    return await handlerFunc(event, context);
  } catch (error) {
    console.error("Handler execution error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Handler execution failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
