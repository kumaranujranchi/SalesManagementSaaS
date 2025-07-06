exports.handler = async (event, context) => {
  try {
    console.log("Function invoked with event:", JSON.stringify(event, null, 2));
    console.log("Event path:", event.path);
    console.log("Event httpMethod:", event.httpMethod);

    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        body: "",
      };
    }

    // Simple routing for health check
    if (
      event.path === "/health" ||
      event.path === "/.netlify/functions/api/health"
    ) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          status: "ok",
          message: "API is working",
          timestamp: new Date().toISOString(),
          path: event.path,
          method: event.httpMethod,
        }),
      };
    }

    // For now, return a simple response for other routes
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Netlify Function is working",
        path: event.path,
        method: event.httpMethod,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Function error:", error);
    console.error("Error stack:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
        stack: error.stack,
      }),
    };
  }
};
