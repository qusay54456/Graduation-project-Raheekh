import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const dbPath =
  process.env.DATABASE_PATH ??
  path.resolve(process.cwd(), "..", "..", "data", "parknow.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const sqlite: Database.Database = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export * from "./schema";
