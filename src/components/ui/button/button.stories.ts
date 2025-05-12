import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    loadingMessage: "Loading...",
    asChild: false,
    isLoading: false,
    children: "Button",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "secondary", "outline", "ghost", "accent", "destructive"],
    },
    size: {
      control: { type: "select" },
      options: ["default", "lg", "sm", "xs"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
  },
};

export const Accent: Story = {
  args: {
    variant: "accent",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const ExtraSmall: Story = {
  args: {
    size: "xs",
  },
};
