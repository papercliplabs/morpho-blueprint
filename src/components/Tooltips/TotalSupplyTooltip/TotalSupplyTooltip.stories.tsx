import type { Meta, StoryObj } from "@storybook/react";

import { TotalSupplyTooltip } from "@/components/Tooltips/TotalSupplyTooltip";
import { ResponsiveProvider } from "@/providers/ResponsiveProvider";

const meta = {
  title: "Tooltips/TotalSupplyTooltip",
  component: TotalSupplyTooltip,
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
    totalSupply: 234222,
    supplyCap: 5676434,
    iconPosition: "right",
  },
  argTypes: {
    iconPosition: {
      control: { type: "radio" },
      options: ["left", "right"],
    },
  },
} satisfies Meta<typeof TotalSupplyTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
