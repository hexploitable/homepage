import unifiDriveProxyHandler from "./proxy";

const widget = {
  api: "{url}{prefix}/api/{endpoint}",
  proxyHandler: unifiDriveProxyHandler,

  mappings: {
    storage: {
      endpoint: "v1/systems/storage?type=detail",
    },
    drives: {
      endpoint: "v1/drives",
    },
    backups: {
      endpoint: "v1/remote-backup/tasks",
    },
  },
};

export default widget;
