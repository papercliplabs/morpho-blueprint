import type { Meta, StoryObj } from "@storybook/react";

import { Skeletons } from "@/components/ui/skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeletons,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    className: "w-10 h-10",
    count: 5,
  },
} satisfies Meta<typeof Skeletons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Multiple: Story = {};
