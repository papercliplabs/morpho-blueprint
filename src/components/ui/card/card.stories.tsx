import type { Meta, StoryObj } from "@storybook/react";

import { Card, CardHeader } from "@/components/ui/card";

const meta = {
  title: "UI/Card",
  component: Card,
  subcomponents: { CardHeader },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Hello from the Card Component!",
  },
};

export const WithHeader: Story = {
  render: (args) => {
    return (
      <Card {...args}>
        <CardHeader>Header</CardHeader>
        This card has a header!
      </Card>
    );
  },
};
