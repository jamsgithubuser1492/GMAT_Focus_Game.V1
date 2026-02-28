import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

const dbUrl = process.env.DATABASE_URL ?? "postgresql://localhost:5432/gmat_focus";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),
  migrate: {
    async url() {
      return dbUrl;
    },
  },
  datasource: {
    url: dbUrl,
  },
});
