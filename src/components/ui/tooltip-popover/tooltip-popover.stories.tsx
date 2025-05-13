import type { Meta, StoryObj } from "@storybook/react";

import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/components/ui/tooltip-popover";
import { ResponsiveProvider, useResponsiveContext } from "@/providers/ResponsiveProvider";

const meta = {
  title: "UI/TooltipPopover",
  component: TooltipPopover,
  subcomponents: { TooltipPopoverContent, TooltipPopoverTrigger },
  decorators: [
    (Story) => (
      <ResponsiveProvider>
        <Story />
      </ResponsiveProvider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: null, // Satisfy TypeScript
  },
  argTypes: {},
} satisfies Meta<typeof TooltipPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

function TooltipPopoverStory(props: React.ComponentProps<typeof TooltipPopover>) {
  const { isDesktop } = useResponsiveContext();

  return (
    <TooltipPopover {...props}>
      <TooltipPopoverTrigger>{isDesktop ? "Hover" : "Click"}</TooltipPopoverTrigger>
      <TooltipPopoverContent>Hello world!</TooltipPopoverContent>
    </TooltipPopover>
  );
}

export const Default: Story = {
  render: (args) => {
    return <TooltipPopoverStory {...args} />;
  },
};
