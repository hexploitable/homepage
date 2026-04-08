import Block from "components/services/widget/block";
import Container from "components/services/widget/container";

import useWidgetAPI from "utils/proxy/use-widget-api";

function IngressRow({ hostname, service: svc }) {
  const url = `https://${hostname}`;
  return (
    <div className="flex flex-row text-theme-700 dark:text-theme-200 items-center text-xs relative h-5 w-full rounded-md bg-theme-200/50 dark:bg-theme-900/20 mt-1">
      <div className="text-xs z-10 self-center ml-2 relative h-4 grow mr-2">
        <div className="absolute w-full whitespace-nowrap text-ellipsis overflow-hidden text-left">
          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">{hostname}</a>
        </div>
      </div>
      <div className="self-center text-xs flex justify-end mr-1.5 pl-1 z-10">
        <span className="text-theme-500 dark:text-theme-300">{svc}</span>
      </div>
    </div>
  );
}

export default function Component({ service }) {
  const { widget } = service;
  const showRoutes = widget.showRoutes === true;

  const { data: statsData, error: statsError } = useWidgetAPI(widget, "cfd_tunnel");
  const { data: configData, error: configError } = useWidgetAPI(widget, showRoutes ? "configurations" : "");

  if (statsError || (showRoutes && configError)) {
    return <Container service={service} error={statsError ?? configError} />;
  }

  if (!statsData) {
    return (
      <Container service={service}>
        <Block label="cloudflared.status" />
        <Block label="cloudflared.origin_ip" />
      </Container>
    );
  }

  const originIP = statsData.result.connections?.origin_ip ?? statsData.result.connections[0]?.origin_ip;
  const status = statsData.result.status.charAt(0).toUpperCase() + statsData.result.status.slice(1);

  const ingress =
    showRoutes && configData?.result?.config?.ingress ? configData.result.config.ingress.filter((r) => r.hostname) : [];

  if (showRoutes) {
    return (
      <>
        <Container service={service}>
          <Block label="cloudflared.status" value={status} />
          <Block label="cloudflared.origin_ip" value={originIP} />
          <Block label="cloudflared.routes" value={ingress.length} />
        </Container>
        {ingress.map((route) => (
          <IngressRow key={route.hostname} hostname={route.hostname} service={route.service} />
        ))}
      </>
    );
  }

  return (
    <Container service={service}>
      <Block label="cloudflared.status" value={status} />
      <Block label="cloudflared.origin_ip" value={originIP} />
    </Container>
  );
}
