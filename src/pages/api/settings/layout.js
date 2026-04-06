import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { CONF_DIR } from "utils/config/config";
import createLogger from "utils/logger";

const logger = createLogger("settingsLayoutAPI");
const LAYOUT_FILE = "grid-layouts.json";

export default async function handler(req, res) {
  const layoutPath = join(CONF_DIR, LAYOUT_FILE);

  if (req.method === "GET") {
    try {
      if (existsSync(layoutPath)) {
        const data = readFileSync(layoutPath, "utf8");
        return res.status(200).json(JSON.parse(data));
      }
      return res.status(200).json(null);
    } catch (e) {
      logger.error("Failed to read grid layouts: %s", e.message);
      return res.status(200).json(null);
    }
  }

  if (req.method === "POST") {
    if (process.env.HOMEPAGE_ALLOW_EDIT !== "true") {
      return res.status(403).json({ error: "Edit mode writes are disabled. Set HOMEPAGE_ALLOW_EDIT=true to enable." });
    }

    const { grid } = req.body;

    if (!grid || typeof grid !== "object") {
      return res.status(400).json({ error: "Invalid request: expected { grid: { lg: [...], ... } }" });
    }

    try {
      writeFileSync(layoutPath, JSON.stringify(grid, null, 2), "utf8");
      logger.info("Grid layouts saved to %s", LAYOUT_FILE);
      return res.status(200).json({ success: true });
    } catch (e) {
      logger.error("Failed to save grid layouts: %s", e.message);
      return res.status(500).json({ error: `Failed to save: ${e.message}` });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
