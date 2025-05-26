import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider } from "next-themes";

import { PoweredByMorpho } from "@/components/PoweredByMorpho";

const meta = {
  title: "Components/PoweredByMorpho",
  component: PoweredByMorpho,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  tags: ["autodocs"],
  args: {
    placement: "center",
  },
  argTypes: {
    placement: {
      control: { type: "select" },
      options: ["left", "right", "center"],
    },
  },
} satisfies Meta<typeof PoweredByMorpho>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
