import type { Meta, StoryObj } from "@storybook/react";

import { ApyTooltipTrigger } from "@/components/Tooltips/ApyToolip";

const meta = {
  title: "Tooltips/ApyToolip/Trigger",
  component: ApyTooltipTrigger,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    type: "borrow",
    totalApy: 0.5,
    showSparkle: false,
    sparkleSide: "right",
    variant: "default",
  },
  argTypes: {
    type: {
      control: { type: "radio" },
      options: ["borrow", "earn"],
    },
    variant: {
      control: { type: "radio" },
      options: ["default", "sm"],
    },
    sparkleSide: {
      control: { type: "radio" },
      options: ["left", "right"],
    },
  },
} satisfies Meta<typeof ApyTooltipTrigger>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = {
  args: {
    variant: "sm",
  },
};
export const WithSparkle: Story = {
  args: {
    showSparkle: true,
  },
};
export const SmallWithSparkle: Story = {
  args: {
    showSparkle: true,
    variant: "sm",
  },
};
export const SmallWithSparkleLeft: Story = {
  args: {
    showSparkle: true,
    sparkleSide: "left",
    variant: "sm",
  },
};
