// functions/admin.js
exports.handler = async (event, context) => {
    // Parse the request body if needed (for POST requests)
    const body = event.body ? JSON.parse(event.body) : {};
  
    // Example: Return a simple JSON response
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Admin API endpoint" }),
    };
};