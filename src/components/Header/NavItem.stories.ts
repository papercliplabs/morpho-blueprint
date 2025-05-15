import type { Meta, StoryObj } from "@storybook/react";

import { NavItem } from "@/components/Header/NavItem";

const meta = {
  title: "Components/Header/NavItem",
  component: NavItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    href: "#",
    active: false,
    name: "Label",
  },
} satisfies Meta<typeof NavItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};
