import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import yaml from "js-yaml";

import { CONF_DIR } from "utils/config/config";
import createLogger from "utils/logger";

const logger = createLogger("settingsLayoutAPI");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (process.env.HOMEPAGE_ALLOW_EDIT !== "true") {
    return res.status(403).json({ error: "Edit mode writes are disabled. Set HOMEPAGE_ALLOW_EDIT=true to enable." });
  }

  const { order } = req.body;

  if (!Array.isArray(order) || !order.every((item) => typeof item === "string")) {
    return res.status(400).json({ error: "Invalid order: expected an array of group name strings" });
  }

  try {
    const settingsPath = join(CONF_DIR, "settings.yaml");
    const rawContents = readFileSync(settingsPath, "utf8");
    const settings = yaml.load(rawContents) ?? {};

    // Backup before writing
    const backupPath = join(CONF_DIR, "settings.yaml.bak");
    copyFileSync(settingsPath, backupPath);

    // Rebuild the layout object with the new order, preserving per-group config
    const existingLayout = settings.layout ?? {};
    const newLayout = {};
    order.forEach((groupName) => {
      newLayout[groupName] = existingLayout[groupName] ?? {};
    });
    // Append any groups not in the new order (safety net)
    Object.keys(existingLayout).forEach((groupName) => {
      if (!newLayout[groupName]) {
        newLayout[groupName] = existingLayout[groupName];
      }
    });

    settings.layout = newLayout;
    const newContents = yaml.dump(settings, { lineWidth: -1, noRefs: true });
    writeFileSync(settingsPath, newContents, "utf8");

    logger.info("Layout order updated: %s", order.join(", "));
    return res.status(200).json({ success: true });
  } catch (e) {
    logger.error("Failed to save layout: %s", e.message);
    return res.status(500).json({ error: `Failed to save layout: ${e.message}` });
  }
}
