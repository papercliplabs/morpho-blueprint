import type { Meta, StoryObj } from "@storybook/react";

import { Header } from "@/components/Header";

const meta = {
  title: "Components/Header",
  component: Header,
  tags: ["autodocs"],
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
