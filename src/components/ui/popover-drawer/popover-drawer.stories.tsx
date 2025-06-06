import type { Meta, StoryObj } from "@storybook/react";

import {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerProps,
  PopoverDrawerTrigger,
} from "@/components/ui/popover-drawer";
import { ResponsiveProvider, useResponsiveContext } from "@/providers/ResponsiveProvider";

const meta = {
  title: "UI/PopoverDrawer",
  component: PopoverDrawer,
  subcomponents: { PopoverDrawerContent, PopoverDrawerTrigger },
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
} satisfies Meta<typeof PopoverDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function PopoverDrawerStory(props: PopoverDrawerProps) {
  const { isDesktop } = useResponsiveContext();

  return (
    <PopoverDrawer {...props}>
      <PopoverDrawerTrigger>Open {isDesktop ? "Popover" : "Drawer"}</PopoverDrawerTrigger>
      <PopoverDrawerContent>PopoverDrawer Content</PopoverDrawerContent>
    </PopoverDrawer>
  );
}

export const Default: Story = {
  render: (args) => {
    return <PopoverDrawerStory {...args} />;
  },
};
