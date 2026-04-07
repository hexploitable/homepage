import classNames from "classnames";
import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

function MonitorRow({ name, status, uptime }) {
  const isUp = status === 1;
  const statusColor = isUp ? "bg-green-500" : "bg-red-500";
  const uptimeStr = uptime !== undefined ? `${(uptime * 100).toFixed(1)}%` : "";

  return (
    <div
      className={classNames(
        "flex flex-row text-theme-700 dark:text-theme-200 items-center text-xs relative h-5 w-full rounded-md bg-theme-200/50 dark:bg-theme-900/20 mt-1",
        !isUp && "opacity-60",
      )}
    >
      <span className="ml-2 h-2 w-2 z-10">
        <span className={classNames("block w-2 h-2 rounded-full", statusColor)} />
      </span>
      <div className="text-xs z-10 self-center ml-2 relative h-4 grow mr-2">
        <div className="absolute w-full whitespace-nowrap text-ellipsis overflow-hidden text-left">{name}</div>
      </div>
      <div className="self-center text-xs flex justify-end mr-1.5 pl-1 z-10 text-theme-500 dark:text-theme-300">
        {uptimeStr}
      </div>
    </div>
  );
}

export default function Component({ service }) {
  const { t } = useTranslation();

  const { widget } = service;
  const showMonitors = widget.showMonitors === true;

  const { data: statusData, error: statusError } = useWidgetAPI(widget, "status_page");
  const { data: heartbeatData, error: heartbeatError } = useWidgetAPI(widget, "heartbeat");

  if (statusError || heartbeatError) {
    return <Container service={service} error={statusError ?? heartbeatError} />;
  }

  if (!statusData || !heartbeatData) {
    return (
      <Container service={service}>
        <Block label="uptimekuma.up" />
        <Block label="uptimekuma.down" />
        <Block label="uptimekuma.uptime" />
        <Block label="uptimekuma.incidents" />
      </Container>
    );
  }

  let sitesUp = 0;
  let sitesDown = 0;
  Object.values(heartbeatData.heartbeatList).forEach((siteList) => {
    const lastHeartbeat = siteList[siteList.length - 1];
    if (lastHeartbeat?.status === 1) {
      sitesUp += 1;
    } else {
      sitesDown += 1;
    }
  });

  const uptimeList = Object.values(heartbeatData.uptimeList);
  const percent = uptimeList.reduce((a, b) => a + b, 0) / uptimeList.length || 0;
  const uptime = (percent * 100).toFixed(1);
  const incidentTime = statusData.incident
    ? Math.abs(new Date(statusData.incident?.createdDate) - new Date()) / 1000 / (60 * 60)
    : null;

  // Build monitor list from status page groups + heartbeat data
  const monitors = [];
  if (showMonitors && statusData.publicGroupList) {
    statusData.publicGroupList.forEach((group) => {
      if (group.monitorList) {
        group.monitorList.forEach((monitor) => {
          const heartbeats = heartbeatData.heartbeatList?.[monitor.id];
          const lastHeartbeat = heartbeats?.[heartbeats.length - 1];
          const monitorUptime = heartbeatData.uptimeList?.[`${monitor.id}_24`];
          monitors.push({
            id: monitor.id,
            name: monitor.name,
            status: lastHeartbeat?.status,
            uptime: monitorUptime,
          });
        });
      }
    });
  }

  if (showMonitors) {
    return (
      <>
        <Container service={service}>
          <Block label="uptimekuma.up" value={t("common.number", { value: sitesUp })} />
          <Block label="uptimekuma.down" value={t("common.number", { value: sitesDown })} />
          <Block
            label="uptimekuma.uptime"
            value={t("common.percent", { value: uptime })}
            highlightValue={Number(uptime)}
          />
        </Container>
        {monitors
          .sort((a, b) => {
            if (a.status !== b.status) return (b.status ?? 0) - (a.status ?? 0);
            return a.name.localeCompare(b.name);
          })
          .map((monitor) => (
            <MonitorRow key={monitor.id} name={monitor.name} status={monitor.status} uptime={monitor.uptime} />
          ))}
      </>
    );
  }

  return (
    <Container service={service}>
      <Block label="uptimekuma.up" value={t("common.number", { value: sitesUp })} />
      <Block label="uptimekuma.down" value={t("common.number", { value: sitesDown })} />
      <Block label="uptimekuma.uptime" value={t("common.percent", { value: uptime })} highlightValue={Number(uptime)} />
      {incidentTime && (
        <Block
          label="uptimekuma.incident"
          value={t("common.number", { value: Math.round(incidentTime) }) + t("uptimekuma.m")}
        />
      )}
    </Container>
  );
}
