import type { Meta, StoryObj } from "@storybook/react";

import { TotalSupplyTooltipContent } from "@/components/Tooltips/TotalSupplyTooltip";

const meta = {
  title: "Tooltips/TotalSupplyTooltip/Content",
  component: TotalSupplyTooltipContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    totalSupply: 234222,
    supplyCap: 5676434,
  },
  argTypes: {},
} satisfies Meta<typeof TotalSupplyTooltipContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
