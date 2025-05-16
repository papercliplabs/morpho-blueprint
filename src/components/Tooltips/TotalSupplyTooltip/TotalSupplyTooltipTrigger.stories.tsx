import type { Meta, StoryObj } from "@storybook/react";

import { TotalSupplyTooltipTrigger } from "@/components/Tooltips/TotalSupplyTooltip";

const meta = {
  title: "Tooltips/TotalSupplyTooltip/Trigger",
  component: TotalSupplyTooltipTrigger,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    iconPosition: "right",
    totalSupply: 234222,
    supplyCap: 5676434,
  },
  argTypes: {
    iconPosition: {
      control: { type: "radio" },
      options: ["left", "right"],
    },
  },
} satisfies Meta<typeof TotalSupplyTooltipTrigger>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
