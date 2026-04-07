import tautulliProxyHandler from "widgets/tautulli/proxy";

const widget = {
  api: "{url}/api/v2?apikey={key}&cmd={endpoint}",
  proxyHandler: tautulliProxyHandler,

  mappings: {
    get_activity: {
      endpoint: "get_activity",
    },
    pms_image_proxy: {
      endpoint: "pms_image_proxy",
      params: ["img", "width", "height"],
    },
  },
};

export default widget;
