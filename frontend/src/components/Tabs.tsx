import { twMerge } from "tailwind-merge";

export type TabSpec<Tabs extends string> = {
  tabId: Tabs;
  node: React.ReactNode;
};

type Props<Tabs extends string, AllowNoSelection extends boolean> = {
  allowNoSelection?: AllowNoSelection;
  currentTab:
  | NoInfer<Tabs>
  | (AllowNoSelection extends true ? undefined : never);
  onTabChange: (
    tab: NoInfer<Tabs> | (AllowNoSelection extends true ? undefined : never),
  ) => void;
  tabs: TabSpec<Tabs>[];
  className?: string;
};

export const Tabs = <
  Tabs extends string,
  AllowNoSelection extends boolean = false,
>({
  allowNoSelection,
  currentTab,
  onTabChange,
  tabs,
  className,
}: Props<Tabs, AllowNoSelection>) => {
  const handleClick = (tabId: Tabs) => {
    if (allowNoSelection === true && currentTab === tabId) {
      // @ts-expect-error we ignore this
      onTabChange(undefined);
    } else if (currentTab !== tabId) {
      onTabChange(tabId);
    }
  };

  return (
    <div className={twMerge(
      "flex border-b border-border",
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.tabId}
          onClick={() => handleClick(tab.tabId)}
          className={twMerge(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
            tab.tabId === currentTab
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text-primary",
          )}
        >
          {tab.node}
        </button>
      ))}
    </div>
  );
};
