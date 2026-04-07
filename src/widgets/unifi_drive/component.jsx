import classNames from "classnames";
import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

function DriveRow({ name, usage, status, encrypted, snapshotEnabled }) {
  const { t } = useTranslation();
  const isActive = status === "active";

  return (
    <div
      className={classNames(
        "flex flex-row text-theme-700 dark:text-theme-200 items-center text-xs relative h-5 w-full rounded-md bg-theme-200/50 dark:bg-theme-900/20 mt-1",
        !isActive && "opacity-50",
      )}
    >
      <span className="ml-2 h-2 w-2 z-10">
        <span className={classNames("block w-2 h-2 rounded-full", isActive ? "bg-green-500" : "bg-red-500")} />
      </span>
      <div className="text-xs z-10 self-center ml-2 relative h-4 grow mr-2">
        <div className="absolute w-full whitespace-nowrap text-ellipsis overflow-hidden text-left">
          {name}
          {encrypted && <span className="ml-1 opacity-50">🔒</span>}
          {snapshotEnabled && <span className="ml-1 opacity-50">📸</span>}
        </div>
      </div>
      <div className="self-center text-xs flex justify-end mr-1.5 pl-1 z-10 text-theme-500 dark:text-theme-300">
        {t("common.bytes", { value: usage, maximumFractionDigits: 1 })}
      </div>
    </div>
  );
}

function BackupRow({ name, status, nextBackup, backupType }) {
  const statusColors = {
    succeeded: "bg-green-500",
    "in-progress": "bg-blue-500",
    failed: "bg-red-500",
  };
  const statusColor = statusColors[status] || "bg-gray-500";

  const nextDate = nextBackup ? new Date(nextBackup) : null;
  const nextStr = nextDate ? nextDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

  return (
    <div className="flex flex-row text-theme-700 dark:text-theme-200 items-center text-xs relative h-5 w-full rounded-md bg-theme-200/50 dark:bg-theme-900/20 mt-1">
      <span className="ml-2 h-2 w-2 z-10">
        <span className={classNames("block w-2 h-2 rounded-full", statusColor)} />
      </span>
      <div className="text-xs z-10 self-center ml-2 relative h-4 grow mr-2">
        <div className="absolute w-full whitespace-nowrap text-ellipsis overflow-hidden text-left">
          {name}
          {backupType && <span className="ml-1 opacity-40 uppercase">{backupType}</span>}
        </div>
      </div>
      {nextStr && (
        <div className="self-center text-xs flex justify-end mr-1.5 pl-1 z-10 text-theme-500 dark:text-theme-300">
          {nextStr}
        </div>
      )}
    </div>
  );
}

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;
  const showDetails = widget.showDetails === true;

  const { data: storageData, error: storageError } = useWidgetAPI(widget, "storage");
  const { data: drivesData } = useWidgetAPI(widget, showDetails ? "drives" : "");
  const { data: backupsData } = useWidgetAPI(widget, showDetails ? "backups" : "");

  if (storageError) {
    return <Container service={service} error={storageError} />;
  }

  if (!storageData) {
    return (
      <Container service={service}>
        <Block field="unifi_drive.total" label="resources.total" />
        <Block field="unifi_drive.used" label="resources.used" />
        <Block field="unifi_drive.available" label="resources.free" />
        <Block field="unifi_drive.status" label="widget.status" />
      </Container>
    );
  }

  const { data: storage } = storageData;

  if (!storage) {
    return (
      <Container service={service}>
        <Block value={t("unifi_drive.no_data")} />
      </Container>
    );
  }

  const { totalQuota, usage, status } = storage;
  const totalBytes = totalQuota ?? 0;
  const usedBytes = (usage?.system || 0) + (usage?.myDrives || 0) + (usage?.sharedDrives || 0);
  const availableBytes = Math.max(0, totalBytes - usedBytes);
  let statusValue = status;
  if (status === "healthy") statusValue = t("unifi_drive.healthy");
  else if (status === "degraded") statusValue = t("unifi_drive.degraded");

  const drives = Array.isArray(drivesData?.drives) ? drivesData.drives : [];
  const backups = Array.isArray(backupsData?.data) ? backupsData.data : [];

  if (showDetails) {
    return (
      <>
        <Container service={service}>
          <Block field="unifi_drive.total" label="resources.total" value={t("common.bytes", { value: totalBytes })} />
          <Block field="unifi_drive.used" label="resources.used" value={t("common.bytes", { value: usedBytes })} />
          <Block field="unifi_drive.status" label="widget.status" value={statusValue} />
        </Container>
        {drives.length > 0 && (
          <>
            <div className="flex items-center text-xs text-theme-500 dark:text-theme-400 mt-2 mx-1">
              <span className="font-semibold uppercase tracking-wider">Drives</span>
              <div className="flex-1 h-px bg-theme-500/20 ml-2" />
              <span className="ml-2 opacity-60">Usage</span>
            </div>
            {drives.map((drive) => (
              <DriveRow
                key={drive.id}
                name={drive.name}
                usage={drive.usage || 0}
                status={drive.status}
                encrypted={drive.protections?.encryptionStatus === "encrypted"}
                snapshotEnabled={drive.protections?.snapshotEnabled}
              />
            ))}
          </>
        )}
        {backups.length > 0 && (
          <>
            <div className="flex items-center text-xs text-theme-500 dark:text-theme-400 mt-2 mx-1">
              <span className="font-semibold uppercase tracking-wider">Backups</span>
              <div className="flex-1 h-px bg-theme-500/20 ml-2" />
              <span className="ml-2 opacity-60">Next</span>
            </div>
            {backups.map((task) => (
              <BackupRow
                key={task.id}
                name={task.name}
                status={task.lastTaskRun?.status}
                nextBackup={task.nextBackup}
                backupType={task.remote?.type}
              />
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <Container service={service}>
      <Block field="unifi_drive.total" label="resources.total" value={t("common.bytes", { value: totalBytes })} />
      <Block field="unifi_drive.used" label="resources.used" value={t("common.bytes", { value: usedBytes })} />
      <Block
        field="unifi_drive.available"
        label="resources.free"
        value={t("common.bytes", { value: availableBytes })}
      />
      <Block field="unifi_drive.status" label="widget.status" value={statusValue} />
    </Container>
  );
}
