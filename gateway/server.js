// Import required modules
const express = require("express"); // Web server framework
const fs = require("fs"); // File system module for reading and watching files

const app = express();
const PORT = 8080; // Port where the API Gateway will listen

// Initialize server list and round-robin index
let servers = []; // Array to store backend servers
let currentIndex = 0; // To track which server to forward the next request to

/**
 * Loads the list of servers from servers.json.
 * This allows dynamic addition or removal of backend servers without restarting the gateway.
 */
function loadServers() {
  try {
    const data = fs.readFileSync("servers.json"); // Read servers.json file synchronously
    servers = JSON.parse(data); // Parse JSON into the servers array
    console.log(
      "Server list loaded:",
      servers.map((s) => s.host)
    ); // Log loaded servers
  } catch (err) {
    console.error("Error loading servers.json:", err.message); // Log any file reading errors
  }
}

// Load servers at startup
loadServers();

/**
 * Watch the servers.json file for changes.
 * If the file is updated (new server added or removed),
 * automatically reload the server list without manual intervention.
 */
fs.watch("servers.json", (eventType, filename) => {
  if (eventType === "change") {
    console.log("🔄 servers.json changed, reloading servers...");
    loadServers(); // Re-read servers.json whenever it changes
  }
});

/**
 * Main request handler for all incoming traffic.
 * Implements a simple Round-Robin load balancing algorithm.
 * Each incoming request is forwarded to the next server in the list.
 */
app.use(async (req, res) => {
  if (servers.length === 0) {
    // If no servers are available, return HTTP 503 Service Unavailable
    return res.status(503).send("No servers available");
  }

  // Select the next server using round-robin
  const targetServer = servers[currentIndex];
  currentIndex = (currentIndex + 1) % servers.length; // Cycle back to start if at end of list

  const targetUrl = `${targetServer.host}${req.originalUrl}`; // Build the full URL to forward to

  try {
    // Prepare fetch options
    const options = {
      method: req.method, // Forward the original HTTP method (GET, POST, etc.)
      headers: req.headers, // Forward all original headers
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req, // Only send body for non-GET/HEAD requests
      duplex: "half", // Required in Node.js 18+ for request streams with body
    };

    // Forward the request to the selected backend server
    const response = await fetch(targetUrl, options);

    // Read the response body and forward it back to the client
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    // If any error occurs during forwarding (server down, network issues), return HTTP 502 Bad Gateway
    console.error(`Error forwarding to ${targetUrl}:`, error);
    res.status(502).send("Bad Gateway");
  }
});

// Start the API Gateway server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});
