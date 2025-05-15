import type { Meta, StoryObj } from "@storybook/react";

import { Avatar } from "@/components/ui/avatar";
import { Step } from "@/components/ui/step";

const meta = {
  title: "UI/Step",
  component: Step,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    number: 1,
    status: "upcoming",
    label: "Description",
  },
  argTypes: {
    status: {
      control: { type: "select" },
      options: ["upcoming", "active", "pending", "complete"],
    },
  },
} satisfies Meta<typeof Step>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    status: "active",
  },
};

export const Pending: Story = {
  args: {
    status: "pending",
  },
};

export const Complete: Story = {
  args: {
    status: "complete",
  },
};

export const CustomIcon: Story = {
  args: {
    icon: <Avatar fallback="CN" src="https://github.com/shadcn.png" size="sm" />,
  },
};
