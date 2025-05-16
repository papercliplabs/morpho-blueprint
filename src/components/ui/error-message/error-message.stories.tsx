import type { Meta, StoryObj } from "@storybook/react";

import { ErrorMessage } from ".";

const meta = {
  title: "UI/ErrorMessage",
  component: ErrorMessage,
  decorators: [
    (Story) => (
      <div className="max-w-[200px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    message:
      "This is an error message with soklasjdflkasjdnlkasjdnflkajndflkajsndflkajsndfme long text which should scroll when it overflows the height for example with long messagesss.....",
  },
  argTypes: {},
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
