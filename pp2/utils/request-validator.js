/**
 * Utility functions for API request validation
 * Created with assistance from GitHub Copilot
 */

/**
 * validates that a request has the expected format (JSON or query params)
 * @param {Request} req - the incoming request
 * @param {'json'|'query'} expectedFormat - the expected format of the request
 * @returns {Object|null} - returns null if valid, or an error response object if invalid
 */

export function validateRequestFormat(req, expectedFormat) {
    const contentType = req.headers.get('content-type');
    
    // Check for JSON format requests
    if (expectedFormat === 'json') {
      if (!contentType || !contentType.includes('application/json')) {
        return {
          error: "Invalid request format",
          details: "This endpoint expects JSON data. Please set Content-Type: application/json header and provide a valid JSON body."
        };
      }
    }
    
    // Check for query parameter requests
    if (expectedFormat === 'query') {
      if (contentType && contentType.includes('application/json')) {
        return {
          error: "Invalid request format",
          details: "This endpoint expects query parameters, not JSON data."
        };
      }
    }
    
    // Request format is valid
    return null;
  }