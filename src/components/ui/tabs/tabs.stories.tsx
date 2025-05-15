import type { Meta, StoryObj } from "@storybook/react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  subcomponents: { TabsList, TabsTrigger },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    defaultValue: "one",
    variant: "default",
  },
  render: (args) => {
    return (
      <Tabs {...args}>
        <TabsList>
          <TabsTrigger value="one">Tab One</TabsTrigger>
          <TabsTrigger value="two">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Tab Content One</TabsContent>
        <TabsContent value="two">Tab Content Two</TabsContent>
      </Tabs>
    );
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Underline: Story = {
  args: {
    variant: "underline",
  },
};

export const Filled: Story = {
  args: {
    variant: "filled",
  },
};
