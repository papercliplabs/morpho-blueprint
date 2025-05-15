import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { Checkbox } from "@/components/ui/checkbox";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="flex items-center">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  args: {
    defaultChecked: false,
    checked: false,
    onCheckedChange: fn(),
  },
  argTypes: {},
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = {
  args: {
    checked: true,
  },
};
export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};
