import { useTranslation } from "react-i18next";
import { enhancedApi } from "../app/enhancedApi";
import { bytesToHumanReadable } from "../util/bytesToHumanReadable";
import { ProgressBar } from "../components/ProgressBar";
import { twMerge } from "tailwind-merge";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Duration } from "luxon";

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
      <div className="flex flex-col sm:flex-row justify-between mt-1 text-sm text-text-secondary">
        <span>
          {bytesToHumanReadable(used)} / {bytesToHumanReadable(total)}
        </span>
        <span>
          {t("state.free")}: {bytesToHumanReadable(free)}
        </span>
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

  const isHealthy = health?.status === "healthy";

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 border border-border rounded-lg bg-surface-2 flex flex-col gap-1">
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            {t("state.serviceState")}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={twMerge(
                "w-2.5 h-2.5 rounded-full flex-shrink-0",
                isHealthy ? "bg-success" : "bg-danger-strong",
              )}
            />
            <span className="text-text-primary font-semibold text-sm">
              {t("state." + (health?.status ?? "unhealthy"))}
            </span>
          </div>
        </div>

        <div className="p-4 border border-border rounded-lg bg-surface-2 flex flex-col gap-1">
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            {t("state.version")}
          </p>
          <p className="text-text-primary font-mono text-sm mt-1">
            {backendState?.version ?? "N/A"}
          </p>
          <p className="text-text-faint font-mono text-xs truncate">
            {backendState?.commit ?? ""}
          </p>
        </div>

        <div className="p-4 border border-border rounded-lg bg-surface-2 flex flex-col gap-1">
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            {t("state.uptime")}
          </p>
          <p className="text-text-primary font-mono text-sm mt-1">
            {uptime.toFormat("hhhh:mm:ss")}
          </p>
        </div>

        <div className="p-4 border border-border rounded-lg bg-surface-2 flex flex-col gap-1">
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            {t("state.totalDocuments")}
          </p>
          <p className="text-text-primary font-semibold text-xl mt-1">
            {numberOfDocuments.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Storage */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-2">
          <h3 className="font-semibold text-text-primary text-sm">
            {t("state.storage")}
          </h3>
        </div>
        <div className="p-4 flex flex-col gap-5">
          {backendState ? (
            <>
              {backendState.stores.map((store, index) => (
                <Fragment key={index}>
                  <div>
                    <p className="text-xs font-mono text-text-secondary mb-2">
                      {store.basePath}
                    </p>
                    <StorageProgressBar
                      used={store.used}
                      total={store.total}
                      free={store.free}
                    />
                  </div>
                </Fragment>
              ))}
              {backendState.stores.length > 1 && (
                <>
                  <hr className="border-border" />
                  <div>
                    <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide">
                      {t("state.totalStorage", "Total")}
                    </p>
                    <StorageProgressBar
                      used={totalStorageUsed}
                      total={totalStorage}
                      free={freeStorage}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-text-secondary text-sm">N/A</p>
          )}
        </div>
      </div>
    </div>
  );
};
