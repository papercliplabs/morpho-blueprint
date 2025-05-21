import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";

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
            <Avatar src="https://github.com/shadcn.png" size="sm" />
            <span className="body-medium-plus">WETH</span>
          </div>
        ),
      },
      {
        value: "USDC",
        component: (
          <div className="flex flex-1 items-center gap-2">
            <Avatar src="https://github.com/shadcn.png" size="sm" />
            <span className="body-medium-plus">USDC</span>
          </div>
        ),
      },
    ],
    emptyValue: "Collateral Asset",
    onSelect: fn(),
    onReset: fn(),
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

function InteractiveStory(props: React.ComponentProps<typeof MultiSelect>) {
  const [value, setValue] = React.useState<string[]>([]);

  const onSelect = (newValue: string) => {
    if (value.includes(newValue)) {
      setValue(value.filter((v) => v !== newValue));
    } else {
      setValue([...value, newValue]);
    }
  };

  const onReset = () => {
    setValue([]);
  };

  return <MultiSelect {...props} onReset={onReset} onSelect={onSelect} value={value} />;
}

export const Interactive: Story = {
  render: (args) => <InteractiveStory {...args} />,
};
