import type { Meta, StoryObj } from "@storybook/react";

import { Metric, MetricWithTooltip } from "@/components/Metric";
import { ApyTooltipContent } from "@/components/Tooltips/ApyToolip";
import { TooltipProvider } from "@/components/ui/tooltip";

const meta = {
  title: "Components/Metric",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Label",
    children: <span className="heading-6">Value</span>,
  },
} satisfies Meta;

export default meta;

export const Default: StoryObj<typeof Metric> = {
  render: (args) => {
    return <Metric {...args} />;
  },
};

export const WithTooltip: StoryObj<typeof MetricWithTooltip> = {
  args: {
    tooltip: <ApyTooltipContent type="borrow" nativeApy={0.05} totalApy={0.1} performanceFee={0.02} />,
  },
  render: (args) => {
    return (
      <TooltipProvider>
        <MetricWithTooltip {...args} />
      </TooltipProvider>
    );
  },
};
