import type { Meta, StoryObj } from "@storybook/react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  subcomponents: { TooltipContent, TooltipTrigger },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    defaultOpen: false,
    delayDuration: 700,
  },
  argTypes: {},
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return (
      <Tooltip {...args}>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent>Hello world!</TooltipContent>
      </Tooltip>
    );
  },
};
