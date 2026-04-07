import classNames from "classnames";
import Block from "components/services/widget/block";
import Container from "components/services/widget/container";

import useWidgetAPI from "utils/proxy/use-widget-api";

function ContainerRow({ name, state, status }) {
  const isRunning = state === "running";
  const statusColor = isRunning ? "bg-green-500" : "bg-red-500/80";

  return (
    <div
      className={classNames(
        "flex flex-row text-theme-700 dark:text-theme-200 items-center text-xs relative h-5 w-full rounded-md bg-theme-200/50 dark:bg-theme-900/20 mt-1",
        !isRunning && "opacity-50",
      )}
    >
      <span className="ml-2 h-2 w-2 z-10">
        <span className={classNames("block w-2 h-2 rounded-full", statusColor)} />
      </span>
      <div className="text-xs z-10 self-center ml-2 relative h-4 grow mr-2">
        <div className="absolute w-full whitespace-nowrap text-ellipsis overflow-hidden text-left">{name}</div>
      </div>
      <div className="self-center text-xs flex justify-end mr-1.5 pl-1 z-10 text-theme-500 dark:text-theme-300">
        {status}
      </div>
    </div>
  );
}

export default function Component({ service }) {
  const { widget } = service;
  const showContainers = widget.showContainers === true;

  if (!widget.fields) {
    widget.fields = widget.kubernetes ? ["applications", "services", "namespaces"] : ["running", "stopped", "total"];
  }

  const { data: containersData, error: containersError } = useWidgetAPI(
    widget,
    widget.kubernetes ? "" : "docker/containers",
    {
      all: 1,
    },
  );

  const { data: applicationsCount, error: applicationsError } = useWidgetAPI(
    widget,
    widget.kubernetes ? "kubernetes/applications" : "",
  );

  const { data: servicesCount, error: servicesError } = useWidgetAPI(
    widget,
    widget.kubernetes ? "kubernetes/services" : "",
  );

  const { data: namespacesCount, error: namespacesError } = useWidgetAPI(
    widget,
    widget.kubernetes ? "kubernetes/namespaces" : "",
  );

  if (widget.kubernetes) {
    const error = applicationsError ?? servicesError ?? namespacesError;
    if (error || typeof applicationsCount === "object") {
      return <Container service={service} error={error ?? applicationsCount} />;
    }

    if (applicationsCount == undefined || servicesCount == undefined || namespacesCount == undefined) {
      return (
        <Container service={service}>
          <Block label="portainer.applications" />
          <Block label="portainer.services" />
          <Block label="portainer.namespaces" />
        </Container>
      );
    }

    return (
      <Container service={service}>
        <Block label="portainer.applications" value={applicationsCount ?? 0} />
        <Block label="portainer.services" value={servicesCount ?? 0} />
        <Block label="portainer.namespaces" value={namespacesCount ?? 0} />
      </Container>
    );
  }

  if (containersError) {
    return <Container service={service} error={containersError} />;
  }

  if (!containersData) {
    return (
      <Container service={service}>
        <Block label="portainer.running" />
        <Block label="portainer.stopped" />
        <Block label="portainer.total" />
      </Container>
    );
  }

  if (containersData.error || containersData.message) {
    return <Container service={service} error={containersData?.error ?? containersData} />;
  }

  const running = containersData.filter((c) => c.State === "running").length;
  const stopped = containersData.filter((c) => c.State === "exited").length;
  const total = containersData.length;

  if (showContainers) {
    const containers = containersData
      .map((c) => ({
        name: (c.Names?.[0] || c.Id?.substring(0, 12) || "unknown").replace(/^\//, ""),
        state: c.State,
        status: c.Status,
      }))
      .sort((a, b) => {
        if (a.state !== b.state) return a.state === "running" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return (
      <>
        <Container service={service}>
          <Block label="portainer.running" value={running} />
          <Block label="portainer.stopped" value={stopped} />
          <Block label="portainer.total" value={total} />
        </Container>
        {containers.map((c) => (
          <ContainerRow key={c.name} name={c.name} state={c.state} status={c.status} />
        ))}
      </>
    );
  }

  return (
    <Container service={service}>
      <Block label="portainer.running" value={running} />
      <Block label="portainer.stopped" value={stopped} />
      <Block label="portainer.total" value={total} />
    </Container>
  );
}
