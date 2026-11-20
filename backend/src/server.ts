import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { schedulePurgeCompletedTodos } from "./jobs/purgeCompletedTodos.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const { app, apollo } = await createApp();

const server = app.listen(env.PORT, () => {
  logger.info("server started", { graphql: `http://localhost:${String(env.PORT)}/graphql` });
});

schedulePurgeCompletedTodos();

// Close the HTTP server, Apollo and the DB pool cleanly on Ctrl+C / container stop.
function shutdown(): void {
  server.close(() => {
    void apollo
      .stop()
      .then(() => prisma.$disconnect())
      .finally(() => process.exit(0));
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
