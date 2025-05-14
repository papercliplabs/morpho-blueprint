import type { Meta, StoryObj } from "@storybook/react";

import { MetricChange } from "@/components/MetricChange";

const meta = {
  title: "Components/MetricChange",
  component: MetricChange,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    name: "Foobar",
    className: "w-[300px]",
    initialValue: 1,
    finalValue: 0,
  },
  argTypes: {},
} satisfies Meta<typeof MetricChange>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithFinalValue: Story = {
  args: {
    initialValue: 0,
    finalValue: 1,
  },
};
