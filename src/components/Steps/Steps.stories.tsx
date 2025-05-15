import type { Meta, StoryObj } from "@storybook/react";

import { Steps } from "@/components/Steps";

const meta = {
  title: "Components/Steps",
  component: Steps,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    steps: [
      {
        number: 1,
        label: "Description",
        status: "complete",
      },
      {
        number: 2,
        label: "Description",
        status: "active",
      },
      {
        number: 3,
        label: "Description",
        status: "upcoming",
      },
    ],
  },
  argTypes: {},
} satisfies Meta<typeof Steps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
