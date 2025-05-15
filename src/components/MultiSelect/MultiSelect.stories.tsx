import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { MultiSelect } from "@/components/MultiSelect";

import { Avatar } from "../ui/avatar";

const meta = {
  title: "Components/MultiSelect",
  component: MultiSelect,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    placeholder: "Search for token",
    value: [],
    options: [
      {
        value: "WETH",
        component: (
          <div className="flex flex-1 items-center gap-2">
            <Avatar fallback="CN" src="https://github.com/shadcn.png" size="sm" />
            <span className="body-medium-plus">WETH</span>
          </div>
        ),
      },
      {
        value: "USDC",
        component: (
          <div className="flex flex-1 items-center gap-2">
            <Avatar fallback="CN" src="https://github.com/shadcn.png" size="sm" />
            <span className="body-medium-plus">USDC</span>
          </div>
        ),
      },
    ],
    emptyValue: "Collateral Asset",
    onSelect: fn(),
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleSelected: Story = {
  args: {
    defaultOpen: true,
    value: ["WETH"],
  },
};

export const MultipleSelected: Story = {
  args: {
    defaultOpen: true,
    value: ["WETH", "USDC"],
  },
};
