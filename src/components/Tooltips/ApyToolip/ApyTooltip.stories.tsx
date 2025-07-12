import type { Meta, StoryObj } from "@storybook/react";

import { ApyTooltip } from "@/components/Tooltips/ApyToolip";
import { TokenCategory } from "@/generated/gql/whisk/graphql";
import { ResponsiveProvider } from "@/providers/ResponsiveProvider";

const meta = {
  title: "Tooltips/ApyToolip",
  component: ApyTooltip,
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
    type: "borrow",
    nativeApy: 0.2,
    totalApy: 0.5,
    performanceFee: 0.05,
    triggerVariant: "default",
    sparkleSide: "right",
    rewards: [
      {
        asset: {
          icon: "https://github.com/shadcn.png",
          symbol: "COMP",
          address: "0x123",
          decimals: 1,
          category: TokenCategory.Stable,
        },
        apr: 0.01,
      },
      {
        asset: {
          icon: "https://github.com/shadcn.png",
          symbol: "POL",
          address: "0x234",
          decimals: 1,
          category: TokenCategory.Stable,
        },
        apr: 0.02,
      },
    ],
  },
  argTypes: {
    type: {
      control: { type: "radio" },
      options: ["borrow", "earn"],
    },
    triggerVariant: {
      control: { type: "radio" },
      options: ["default", "sm"],
    },
    sparkleSide: {
      control: { type: "radio" },
      options: ["left", "right"],
    },
  },
} satisfies Meta<typeof ApyTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
