import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import sqliteStoreFactory from "better-sqlite3-session-store";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const SQLiteStore = sqliteStoreFactory(session);

const sessionDbPath =
  process.env.SESSION_DB_PATH ??
  path.resolve(process.cwd(), "..", "..", "data", "sessions.db");
fs.mkdirSync(path.dirname(sessionDbPath), { recursive: true });
const sessionDb = new Database(sessionDbPath);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

// Trust proxy for accurate IPs behind Replit's proxy (needed for rate limiting)
app.set("trust proxy", 1);

app.use(
  session({
    store: new SQLiteStore({
      client: sessionDb,
      expired: { clear: true, intervalMs: 15 * 60 * 1000 },
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  }),
);

app.use("/api", router);

export default app;
