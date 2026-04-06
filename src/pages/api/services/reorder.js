import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import yaml from "js-yaml";

import { CONF_DIR } from "utils/config/config";
import createLogger from "utils/logger";

const logger = createLogger("servicesReorderAPI");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (process.env.HOMEPAGE_ALLOW_EDIT !== "true") {
    return res.status(403).json({ error: "Edit mode writes are disabled. Set HOMEPAGE_ALLOW_EDIT=true to enable." });
  }

  const { sourceGroup, serviceName, destinationGroup, destinationIndex } = req.body;

  if (!sourceGroup || !serviceName || !destinationGroup || destinationIndex === undefined) {
    return res.status(400).json({ error: "Missing required fields: sourceGroup, serviceName, destinationGroup, destinationIndex" });
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

    // Find source group and extract the service
    const sourceGroupEntry = services.find((g) => Object.keys(g)[0] === sourceGroup);
    if (!sourceGroupEntry) {
      return res.status(404).json({ error: `Source group "${sourceGroup}" not found` });
    }

    const sourceServices = sourceGroupEntry[sourceGroup];
    const serviceIdx = sourceServices.findIndex((s) => Object.keys(s)[0] === serviceName);
    if (serviceIdx === -1) {
      return res.status(404).json({ error: `Service "${serviceName}" not found in group "${sourceGroup}"` });
    }

    const [serviceEntry] = sourceServices.splice(serviceIdx, 1);

    // Find destination group and insert the service
    const destGroupEntry = services.find((g) => Object.keys(g)[0] === destinationGroup);
    if (!destGroupEntry) {
      return res.status(404).json({ error: `Destination group "${destinationGroup}" not found` });
    }

    const destServices = destGroupEntry[destinationGroup];
    const insertAt = Math.min(destinationIndex, destServices.length);
    destServices.splice(insertAt, 0, serviceEntry);

    const newContents = yaml.dump(services, { lineWidth: -1, noRefs: true });
    writeFileSync(servicesPath, newContents, "utf8");

    logger.info("Service '%s' moved from '%s' to '%s' at index %d", serviceName, sourceGroup, destinationGroup, insertAt);
    return res.status(200).json({ success: true });
  } catch (e) {
    logger.error("Failed to reorder service: %s", e.message);
    return res.status(500).json({ error: `Failed to reorder service: ${e.message}` });
  }
}
