import type { Meta, StoryObj } from "@storybook/react";

import { Switch } from "@/components/ui/switch";

const meta = {
  title: "UI/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    checked: false,
    disabled: false,
  },
  argTypes: {},
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = {
  args: {
    checked: true,
  },
};
export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};
