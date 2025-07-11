import type { Meta, StoryObj } from "@storybook/react";
import { TokenCategory } from "@/generated/gql/whisk/graphql";
import { AssetChangeSummary } from ".";

const meta = {
  title: "Components/AssetChangeSummary",
  component: AssetChangeSummary,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    asset: {
      icon: "https://github.com/shadcn.png",
      symbol: "CN",
      address: "0x123",
      decimals: 0.01,
      category: TokenCategory.Stable,
    },
    className: "min-w-[300px]",
    label: "Label",
    description: "Description",
    amount: 1.0,
    amountUsd: 2.0,
  },
} satisfies Meta<typeof AssetChangeSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
