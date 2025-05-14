import type { Meta, StoryObj } from "@storybook/react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const meta = {
  title: "UI/Popover",
  component: Popover,
  subcomponents: { PopoverTrigger, PopoverContent },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    defaultOpen: false,
  },
  argTypes: {},
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return (
      <Popover {...args}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Hello world!</PopoverContent>
      </Popover>
    );
  },
};

export const Open: Story = {
  ...Default,
  args: {
    defaultOpen: true,
  },
};
