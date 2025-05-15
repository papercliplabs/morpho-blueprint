import type { Meta, StoryObj } from "@storybook/react";

import { IrmChart } from "@/components/IrmChart";

const meta = {
  title: "Components/IrmChart",
  component: IrmChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    currentUtilization: 0.2,
    data: [
      {
        utilization: 0.0,
        supplyApy: 0.0,
        borrowApy: 0.0012,
      },
      {
        utilization: 0.1,
        supplyApy: 0.0003,
        borrowApy: 0.0033,
      },
      {
        utilization: 0.2,
        supplyApy: 0.0008,
        borrowApy: 0.0041,
      },
      {
        utilization: 0.3,
        supplyApy: 0.015,
        borrowApy: 0.049,
      },
      {
        utilization: 0.4,
        supplyApy: 0.13,
        borrowApy: 0.16,
      },
      {
        utilization: 0.5,
        supplyApy: 0.17,
        borrowApy: 0.18,
      },
    ],
  },
} satisfies Meta<typeof IrmChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
