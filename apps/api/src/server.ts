import http from "http";
import app from "./app.js";
import env from "./config/env.js";
import { initSocket } from "./realtime/socket.js";

const server = http.createServer(app);

initSocket(server);

server.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.port}`);
});
