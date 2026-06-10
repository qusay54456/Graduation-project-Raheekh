import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath =
  process.env.DATABASE_PATH ??
  path.resolve(process.cwd(), "..", "..", "data", "parknow.db");

export default defineConfig({
  // تم التعديل هنا: استخدام مسار نسبي مباشر مع شرطات مائلة للأمام (/) لحل مشكلة ويندوز
  schema: "./src/schema/*.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});