import getServiceWidget from "utils/config/service-helpers";
import createLogger from "utils/logger";
import { formatApiCall, sanitizeErrorURL } from "utils/proxy/api-helpers";
import { httpProxy } from "utils/proxy/http";
import validateWidgetData from "utils/proxy/validate-widget-data";
import widgets from "widgets/widgets";

const logger = createLogger("tautulliProxyHandler");

export default async function tautulliProxyHandler(req, res, map) {
  const { group, service, endpoint, index } = req.query;

  if (!group || !service) {
    return res.status(400).json({ error: "Missing group or service" });
  }

  const widget = await getServiceWidget(group, service, index);
  if (!widget || !widgets?.[widget.type]?.api) {
    return res.status(403).json({ error: "Service does not support API calls" });
  }

  const isImageProxy = endpoint && endpoint.startsWith("pms_image_proxy");

  let urlString = formatApiCall(widgets[widget.type].api, { endpoint, ...widget }).replace(/(?<=\?.*)\?/g, "&");
  const url = new URL(urlString);

  const headers = {
    ...(widgets[widget.type].headers ?? {}),
    ...(widget.headers ?? {}),
    ...(req.extraHeaders ?? {}),
  };

  if (widget.username && widget.password) {
    headers.Authorization = `Basic ${Buffer.from(`${widget.username}:${widget.password}`).toString("base64")}`;
  }

  const [status, contentType, data] = await httpProxy(url, { method: req.method, headers });

  if (status === 204 || status === 304) {
    return res.status(status).end();
  }

  if (status >= 400) {
    logger.debug("HTTP Error %d calling %s", status, sanitizeErrorURL(url));
    return res.status(status).json({ error: { message: "HTTP Error", url: sanitizeErrorURL(url) } });
  }

  if (contentType) res.setHeader("Content-Type", contentType);

  // For image proxy, skip JSON validation and return raw binary
  if (isImageProxy) {
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(status).send(data);
  }

  // For all other endpoints, validate and process as normal
  let resultData = data;
  if (status === 200) {
    if (!validateWidgetData(widget, endpoint, resultData)) {
      return res.status(500).json({ error: { message: "Invalid data", url: sanitizeErrorURL(url), data: resultData } });
    }
    if (map) resultData = map(resultData);
  }

  return res.status(status).send(resultData);
}
