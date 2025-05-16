import type { Meta, StoryObj } from "@storybook/react";

import { AvailableLiquidityTooltipContent } from "@/components/Tooltips/AvailableLiquidityTooltip";

const meta = {
  title: "Tooltips/AvailableLiquidityTooltip/Content",
  component: AvailableLiquidityTooltipContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    marketLiquidity: 1367.42,
    publicAllocatorLiquidity: 9534000,
    totalLiquidity: 9540000,
  },
} satisfies Meta<typeof AvailableLiquidityTooltipContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
