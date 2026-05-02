import { useTranslation } from "react-i18next";
import { enhancedApi } from "../app/enhancedApi";
import { bytesToHumanReadable } from "../util/bytesToHumanReadable";
import { ProgressBar } from "../components/ProgressBar";
import { twMerge } from "tailwind-merge";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Duration } from "luxon";

const Key = ({ translationKey }: { translationKey: string }) => {
  const { t } = useTranslation();
  return (
    <div className="col-span-2 sm:col-span-1 font-bold">
      {t(translationKey)}
    </div>
  );
};

const Value = ({ children }: { children: React.ReactNode }) => {
  return <div className="col-span-2 sm:col-span-3">{children}</div>;
};

const percentageToColor = (percentage: number) => {
  if (percentage < 0.7) return "bg-success-subtle";
  if (percentage < 0.9) return "bg-warning";
  return "bg-danger-subtle";
};

const StorageProgressBar = ({
  used,
  total,
  free,
}: {
  used: number;
  total: number;
  free: number;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <ProgressBar
        max={total}
        value={used}
        color={percentageToColor(used / total)}
      />
      <div className="flex flex-col sm:flex-row justify-between mt-1">
        <div>
          {bytesToHumanReadable(used)} / {bytesToHumanReadable(total)}
        </div>
        <div>
          {t("state.free")}: {bytesToHumanReadable(free)}
        </div>
      </div>
    </>
  );
};

export const StatePage = () => {
  const { data: backendState } = enhancedApi.useGetBackendStateQuery(void 0, {
    pollingInterval: 10000,
  });
  const { data: health } = enhancedApi.useHealthQuery(void 0, {
    pollingInterval: 10000,
  });

  const { t } = useTranslation();

  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSeconds((prev) => prev + (backendState ? 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [backendState]);

  useEffect(() => {
    setUptimeSeconds(backendState?.uptime ?? 0);
  }, [backendState?.uptime]);

  const numberOfDocuments = useMemo(
    () =>
      backendState?.stores.reduce(
        (acc, store) => acc + store.numberOfDocuments,
        0,
      ) ?? 0,
    [backendState],
  );
  const totalStorageUsed = useMemo(
    () => backendState?.stores.reduce((acc, store) => acc + store.used, 0) ?? 0,
    [backendState],
  );
  const freeStorage = useMemo(
    () => backendState?.stores.reduce((acc, store) => acc + store.free, 0) ?? 0,
    [backendState],
  );
  const totalStorage = useMemo(
    () =>
      backendState?.stores.reduce((acc, store) => acc + store.total, 0) ?? 0,
    [backendState],
  );

  const uptime = useMemo(
    () => Duration.fromObject({ seconds: uptimeSeconds }),
    [uptimeSeconds],
  );

  return (
    <div className="grid p-8 gap-4 grid-cols-4">
      <Key translationKey="state.serviceState" />
      <Value>
        {t("state." + (health?.status ?? "unhealthy"))}
        <div
          className={twMerge(
            "inline-block w-4 rounded-full ml-2 h-4 translate-y-0.5",
            health?.status === "healthy" ? "bg-success" : "bg-danger-strong",
          )}
        />
      </Value>
      <Key translationKey="state.version" />
      <Value>{backendState?.version ?? "N/A"} ({backendState?.commit ?? "N/A"})</Value>
      <Key translationKey="state.uptime" />
      <Value>{uptime.toFormat("hhhh:mm:ss")}</Value>
      <Key translationKey="state.totalDocuments" />
      <Value>{numberOfDocuments}</Value>
      <Key translationKey="state.storage" />
      <Value>
        {backendState ? (
          <StorageProgressBar
            used={totalStorageUsed}
            total={totalStorage}
            free={freeStorage}
          />
        ) : (
          "N/A"
        )}
      </Value>
      <hr className="col-span-4 mt-4 mb-4" />
      {backendState?.stores.map((store, index) => (
        <Fragment key={index}>
          <Key translationKey={store.basePath} />
          <Value>
            <StorageProgressBar
              used={store.used}
              total={store.total}
              free={store.free}
            />
          </Value>
        </Fragment>
      ))}
      <hr className="col-span-4 mt-4 mb-4" />
      <h3 className="col-span-4 text-lg font-bold">
        {t("state.backendPlugins")}
      </h3>
      {backendState?.plugins.map((plugin, index) => (
        <Fragment key={index}>
          <Key translationKey={plugin.name} />
          <Value>
            <span className="font-semibold">{plugin.description}</span>
            <div>
              {t(`settings.plugin.trusted`)}:{" "}
              {t("settings.plugin." + (plugin.trusted ? "yes" : "no"))}
            </div>
          </Value>
        </Fragment>
      ))}
    </div>
  );
};
