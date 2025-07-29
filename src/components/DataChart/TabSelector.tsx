import type { ComponentProps } from "react";
import { cn } from "@/utils/shadcn";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import type { DataChart } from "./DataChart";
import type { DataEntry } from "./types";

type TokenAmountOption<T> = {
  type: "tokenAmount";
  key: Exclude<keyof T, "bucketTimestamp">;
  title: string;
  usdValue: number;
  underylingAssetSymbol: string;
  underlyingAssetValue: number;
};

type ApyOption<T> = {
  type: "apy";
  key: Exclude<keyof T, "bucketTimestamp">;
  title: string;
  baseApy: number;
  totalApy: number;
};

export type TabOptions<T> = TokenAmountOption<T> | ApyOption<T>;

type Props<T extends DataEntry> = {
  tabs: ComponentProps<typeof DataChart<T>>["tabOptions"] | TokenAmountOption<T>[];
  selected: Exclude<keyof T, "bucketTimestamp">;
  setSelected: (tab: Exclude<keyof T, "bucketTimestamp">) => void;
  className?: string;
};

export function TabSelector<T extends DataEntry>(props: Props<T>) {
  const { tabs, selected, setSelected, className } = props;

  if (!tabs) return null;

  return (
    <Tabs
      value={selected.toString()}
      variant="default"
      onValueChange={(v) => setSelected(v as Exclude<keyof T, "bucketTimestamp">)}
      className={cn("w-fit", className)}
    >
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key.toString()} value={tab.key.toString()}>
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
