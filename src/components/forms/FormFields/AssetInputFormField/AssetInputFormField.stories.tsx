import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { AssetInputFormField } from "@/components/forms/FormFields/AssetInputFormField";
import { Form } from "@/components/ui/form";
import { TokenCategory } from "@/generated/gql/whisk/graphql";

function FormWrapper({ children }: { children: ReactNode }) {
  const form = useForm();
  return (
    <div className="flex min-w-[400px]">
      <Form {...form}>{children}</Form>
    </div>
  );
}

const meta = {
  title: "Forms/AssetInputFormField",
  component: AssetInputFormField,
  decorators: [
    (Story) => (
      <FormWrapper>
        <Story />
      </FormWrapper>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    asset: {
      priceUsd: 1.05,
      address: "0x123",
      symbol: "TST",
      icon: "https://github.com/shadcn.png",
      decimals: 0.06,
      category: TokenCategory.Stable,
    },
    maxValue: 1000000000000000000n,
    setIsMax: fn(),
    name: "test",
    header: "Supply",
    chain: {
      id: 1,
      name: "CHN",
      icon: "https://github.com/shadcn.png",
    },
  },
} satisfies Meta<typeof AssetInputFormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
