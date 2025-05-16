import type { Meta, StoryObj } from "@storybook/react";

import { AvailableLiquidityTooltip } from "@/components/Tooltips/AvailableLiquidityTooltip";
import { ResponsiveProvider } from "@/providers/ResponsiveProvider";

const meta = {
  title: "Tooltips/AvailableLiquidityTooltip",
  component: AvailableLiquidityTooltip,
  decorators: [
    (Story) => (
      <ResponsiveProvider>
        <Story />
      </ResponsiveProvider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    marketLiquidity: 1367.42,
    publicAllocatorLiquidity: 9534000,
    totalLiquidity: 9540000,
  },
} satisfies Meta<typeof AvailableLiquidityTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
