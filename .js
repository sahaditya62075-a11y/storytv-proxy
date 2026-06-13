export const config = {
  runtime: 'edge', // This forces Vercel to run at Cloudflare speeds
};

export default async function (request) {
  const BACKEND_URL = "https://api.storytv.asia";
  const method = request.method;

  // 1. Lightning-Fast CORS Preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
        "Access-Control-Max-Age": "86400", 
      }
    });
  }

  try {
    const url = new URL(request.url);
    
    // 2. Build the exact target URL keeping the app's paths and query strings
    const targetUrl = new URL(url.pathname + url.search, BACKEND_URL);

    // 3. Header Cloning & IP Sanitization
    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set("Host", targetUrl.hostname);
    proxyHeaders.set("X-Forwarded-Proto", "https");

    const headersToStrip = [
      "x-forwarded-for",
      "x-real-ip",
      "true-client-ip",
      "x-client-ip",
      "forwarded"
    ];
    headersToStrip.forEach(header => proxyHeaders.delete(header));

    // 4. Construct the Request (With the GET/HEAD body fix)
    const fetchOptions = {
      method: method,
      headers: proxyHeaders,
      redirect: "manual"
    };

    if (method !== "GET" && method !== "HEAD") {
      fetchOptions.body = request.body;
    }

    // 5. Execute the Fetch to your backend
    const response = await fetch(targetUrl.toString(), fetchOptions);

    // 6. Clean and Return the Response
    const proxyResponse = new Response(response.body, response);
    proxyResponse.headers.set("Access-Control-Allow-Origin", "*");
    
    return proxyResponse;

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error_code: 502,
        message: "Gateway Error: " + error.message 
      }),
      { 
        status: 502, 
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        } 
      }
    );
  }
}
