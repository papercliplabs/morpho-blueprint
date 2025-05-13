import type { Meta, StoryObj } from "@storybook/react";

import { Slider } from "@/components/ui/slider";

const meta = {
  title: "UI/Slider",
  component: Slider,
  decorators: [
    (Story) => (
      <div className="flex min-w-[100px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    defaultValue: [50],
    disabled: false,
  },
  argTypes: {},
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
