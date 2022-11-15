#!/usr/bin/env node

const { Server: WebSocketServer } = require("ws");
const express = require("express");
const http = require("http");
const ParcelBundler = require("parcel-bundler");

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = "public";
const STATIC_DIR = "static";

/**
 * Build and minify all client code for Express
 */
function bundleClient() {
  const options = {
    outDir: PUBLIC_DIR,
    contentHash: true,
    bundleNodeModules: true,
    watch: false,
    detailedReport: true
  };
  const bundler = new ParcelBundler("index.html", options);
  return bundler.bundle();
}

/**
 * Setup a quick Web Socket server
 */
function setupWSServer(server) {
  const wss = new WebSocketServer({
    server,
    autoAcceptConnections: false
  });
  let actorCoordinates = { x: 100, y: 100 };
  wss.on("connection", (ws) => {
    ws.on("message", (rawMsg) => {
      console.log(`RECV: ${rawMsg}`);
      const incommingMessage = JSON.parse(rawMsg);
      actorCoordinates[incommingMessage.id] = {
        x: incommingMessage.x,
        y: incommingMessage.y,
        frame: incommingMessage.frame
      }
      wss.clients.forEach((wsClient) => {
        wsClient.send(JSON.stringify(actorCoordinates));
      })
    });
    ws.send(JSON.stringify(actorCoordinates));
  });
  wss.on("listening", () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    console.log(`WebSocketServer listening on ${bind}`);
  });
  return wss;
}

/**
 * Setup an Express application and web server
 */
function setupServer() {
  // Setup the Express application
  const app = express();
  app.set("port", PORT)
  app.use("/", express.static(PUBLIC_DIR))
  app.use("/static", express.static(STATIC_DIR))

  // Setup the HTTP Web Server
  const server = http.createServer(app);
  server.listen(PORT);
  server.on("listening", () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    console.log(`WebServer listening on ${bind}`);
  });
  server.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
  return server;
}

if (require.main === module) {
  bundleClient().then(() => {
    const server = setupServer();
    setupWSServer(server);
  });
}
