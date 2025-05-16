import type { Meta, StoryObj } from "@storybook/react";

import { Separator } from "@/components/ui/seperator";

const meta = {
  title: "UI/Seperator",
  component: Separator,
  decorators: [
    (Story) => (
      <div className="h-[100px] w-[100px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    orientation: "horizontal",
  },
  argTypes: {},
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
};
