import type { Meta, StoryObj } from "@storybook/react";

import { ApyTooltipContent } from "@/components/Tooltips/ApyToolip";

const meta = {
  title: "Tooltips/ApyToolip/Content",
  component: ApyTooltipContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    type: "borrow",
    nativeApy: 0.2,
    totalApy: 0.5,
    performanceFee: 0.05,
  },
  argTypes: {
    type: {
      control: { type: "radio" },
      options: ["borrow", "earn"],
    },
  },
} satisfies Meta<typeof ApyTooltipContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithRewards: Story = {
  args: {
    rewards: [
      {
        asset: {
          icon: "https://github.com/shadcn.png",
          symbol: "COMP",
          address: "0x123",
          decimals: 1,
        },
        apr: 0.01,
      },
      {
        asset: {
          icon: "https://github.com/shadcn.png",
          symbol: "POL",
          address: "0x234",
          decimals: 1,
        },
        apr: 0.02,
      },
    ],
  },
};
