import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import yaml from "js-yaml";

import { CONF_DIR } from "utils/config/config";
import createLogger from "utils/logger";

const logger = createLogger("servicesRenameAPI");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (process.env.HOMEPAGE_ALLOW_EDIT !== "true") {
    return res.status(403).json({ error: "Edit mode writes are disabled. Set HOMEPAGE_ALLOW_EDIT=true to enable." });
  }

  const { type, groupName, oldName, newName, field } = req.body;

  if (!type || !groupName) {
    return res.status(400).json({ error: "Missing required fields: type, groupName" });
  }

  try {
    const servicesPath = join(CONF_DIR, "services.yaml");
    const rawContents = readFileSync(servicesPath, "utf8");
    const services = yaml.load(rawContents);

    if (!Array.isArray(services)) {
      return res.status(500).json({ error: "services.yaml is not a valid array" });
    }

    // Backup before writing
    const backupPath = join(CONF_DIR, "services.yaml.bak");
    copyFileSync(servicesPath, backupPath);

    if (type === "group") {
      // Rename a group
      const groupEntry = services.find((g) => Object.keys(g)[0] === groupName);
      if (!groupEntry) {
        return res.status(404).json({ error: `Group "${groupName}" not found` });
      }

      if (!newName) {
        return res.status(400).json({ error: "newName is required for group rename" });
      }

      // Rename the key in the object
      groupEntry[newName] = groupEntry[groupName];
      delete groupEntry[groupName];

      // Also update settings.yaml layout if it references this group
      try {
        const settingsPath = join(CONF_DIR, "settings.yaml");
        const settingsRaw = readFileSync(settingsPath, "utf8");
        const settingsData = yaml.load(settingsRaw) ?? {};
        if (settingsData.layout?.[groupName]) {
          settingsData.layout[newName] = settingsData.layout[groupName];
          delete settingsData.layout[groupName];
          writeFileSync(settingsPath, yaml.dump(settingsData, { lineWidth: -1, noRefs: true }), "utf8");
        }
      } catch {
        // Non-fatal: settings layout update is optional
      }

      logger.info("Group renamed from '%s' to '%s'", groupName, newName);
    } else if (type === "service") {
      // Rename a service name or update its description
      const groupEntry = services.find((g) => Object.keys(g)[0] === groupName);
      if (!groupEntry) {
        return res.status(404).json({ error: `Group "${groupName}" not found` });
      }

      const groupServices = groupEntry[groupName];
      const serviceEntry = groupServices.find((s) => Object.keys(s)[0] === oldName);
      if (!serviceEntry) {
        return res.status(404).json({ error: `Service "${oldName}" not found in group "${groupName}"` });
      }

      if (field === "description") {
        // Update description
        serviceEntry[oldName].description = newName;
        logger.info("Service '%s' in '%s' description updated", oldName, groupName);
      } else {
        // Rename the service key
        if (!newName) {
          return res.status(400).json({ error: "newName is required for service rename" });
        }
        serviceEntry[newName] = serviceEntry[oldName];
        delete serviceEntry[oldName];
        logger.info("Service renamed from '%s' to '%s' in group '%s'", oldName, newName, groupName);
      }
    } else {
      return res.status(400).json({ error: `Invalid type: "${type}". Must be "group" or "service"` });
    }

    const newContents = yaml.dump(services, { lineWidth: -1, noRefs: true });
    writeFileSync(servicesPath, newContents, "utf8");

    return res.status(200).json({ success: true });
  } catch (e) {
    logger.error("Failed to rename: %s", e.message);
    return res.status(500).json({ error: `Failed to rename: ${e.message}` });
  }
}
