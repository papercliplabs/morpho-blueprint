import type { Meta, StoryObj } from "@storybook/react";
import { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { SliderInputFormField } from "@/components/Forms/FormFields/SliderInputFormField";
import { Form } from "@/components/ui/form";

function FormWrapper({ children }: { children: ReactNode }) {
  const form = useForm();
  return (
    <div className="flex min-w-[400px]">
      <Form {...form}>{children}</Form>
    </div>
  );
}

const meta = {
  title: "UI/SliderInputFormField",
  component: SliderInputFormField,
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
    name: "test",
    sliderMin: 1,
    sliderMax: 6,
    sliderStep: 0.1,
    defaultValue: 3,
    showTicks: true,
    labelContent: "Multiplier",
    includeInput: true,
    unit: "x",
  },
  argTypes: {},
} satisfies Meta<typeof SliderInputFormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutInput: Story = { args: { includeInput: false } };

export const WithoutTicks: Story = { args: { showTicks: false } };
