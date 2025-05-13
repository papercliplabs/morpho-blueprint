import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "@/components/ui/input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    disabled: false,
    placeholder: "Enter some text...",
    variantSize: "default",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["default", "sm"],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { variantSize: "sm" } };

export const Disabled: Story = { args: { disabled: true } };

export const WithValue: Story = { args: { defaultValue: "Hello" } };
