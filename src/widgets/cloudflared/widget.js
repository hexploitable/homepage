import credentialedProxyHandler from "utils/proxy/handlers/credentialed";

const widget = {
  api: "https://api.cloudflare.com/client/v4/accounts/{accountid}/{endpoint}",
  proxyHandler: credentialedProxyHandler,

  mappings: {
    cfd_tunnel: {
      endpoint: "cfd_tunnel/{tunnelid}",
      validate: ["success", "result"],
    },
    configurations: {
      endpoint: "cfd_tunnel/{tunnelid}/configurations",
      validate: ["success", "result"],
    },
  },
};

export default widget;
