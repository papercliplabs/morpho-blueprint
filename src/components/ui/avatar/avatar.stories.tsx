import type { Meta, StoryObj } from "@storybook/react";

import { Avatar } from "@/components/ui/avatar";
import Plus from "@/components/ui/icons/Plus";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  decorators: [
    (Story) => (
      <div className="flex">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    src: "https://github.com/shadcn.png",
    alt: "Very Cool Avatar!",
    size: "md",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["xl", "lg", "md", "sm", "xs"],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Fallback: Story = {
  args: {
    src: undefined,
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
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

export const WithSub: Story = {
  args: {
    sub: <Plus />,
  },
};
