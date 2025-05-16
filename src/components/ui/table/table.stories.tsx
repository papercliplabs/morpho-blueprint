import type { Meta } from "@storybook/react";
import { fn } from "@storybook/test";
import { createColumnHelper } from "@tanstack/react-table";

import { Avatar } from "@/components/ui/avatar";
import { Table } from "@/components/ui/table";

type Row = {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl: string;
};

const columnHelper = createColumnHelper<Row>();

const columns = [
  columnHelper.accessor("avatarUrl", {
    cell: ({ row }) => {
      return <Avatar src={row.original.avatarUrl} fallback="?" />;
    },
    header: "Avatar",
    enableSorting: false,
    minSize: 100,
  }),
  columnHelper.accessor("firstName", {
    header: "First Name",
    minSize: 150,
  }),
  columnHelper.accessor("lastName", {
    header: "Last Name",
    minSize: 150,
  }),
];

const data: Row[] = [
  {
    id: 1,
    firstName: "John",
    lastName: "Dough",
    avatarUrl: "https://github.com/shadcn.png",
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Doe",
    avatarUrl: "https://github.com/shadcn.png",
  },
];

const meta = {
  title: "UI/Table",
  component: Table,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    columns,
    data,
    rowAction: fn(),
  },
} satisfies Meta<typeof Table<Row, string>>;

export default meta;

// Couldn't get this to work with TypeScript...
// `Story` type seen in other stories has been omitted
export const Default = {};

export const EmptyTable = {
  args: {
    data: [],
  },
};
