import type { Meta, StoryObj } from "@storybook/react";

import { DialogDrawer, DialogDrawerContent, DialogDrawerTrigger } from "@/components/ui/dialog-drawer";
import { ResponsiveProvider, useResponsiveContext } from "@/providers/ResponsiveProvider";

const meta = {
  title: "UI/DialogDrawer",
  component: DialogDrawer,
  subcomponents: { DialogDrawerContent, DialogDrawerTrigger },
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
} satisfies Meta<typeof DialogDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function TooltipPopoverStory(props: React.ComponentProps<typeof DialogDrawer>) {
  const { isDesktop } = useResponsiveContext();

  return (
    <DialogDrawer {...props}>
      <DialogDrawerTrigger>{isDesktop ? "Show Dialog" : "Show Drawer"}</DialogDrawerTrigger>
      <DialogDrawerContent>Hello world!</DialogDrawerContent>
    </DialogDrawer>
  );
}

export const Default: Story = {
  render: (args) => {
    return <TooltipPopoverStory {...args} />;
  },
};
