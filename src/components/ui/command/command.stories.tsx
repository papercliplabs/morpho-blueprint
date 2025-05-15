import { action } from "@storybook/addon-actions";
import type { StoryObj } from "@storybook/react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const meta = {
  title: "UI/Command",
  component: Command,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

const onSelectAction = action("CommandItem.onSelect");
const onInputChange = action("CommandInput.onValueChange");

export const Default: StoryObj<typeof Command> = {
  render: (args) => {
    return (
      <Command {...args}>
        <CommandInput placeholder="Type a command or search..." onValueChange={onInputChange} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={onSelectAction}>Calendar</CommandItem>
            <CommandItem onSelect={onSelectAction}>Search Emoji</CommandItem>
            <CommandItem onSelect={onSelectAction}>Calculator</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={onSelectAction}>Profile</CommandItem>
            <CommandItem onSelect={onSelectAction}>Billing</CommandItem>
            <CommandItem onSelect={onSelectAction}>Settings</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
  },
};

export const Dialog: StoryObj<typeof CommandDialog> = {
  args: {
    open: true,
  },
  render: (args) => {
    return (
      <CommandDialog {...args}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>Profile</CommandItem>
            <CommandItem>Billing</CommandItem>
            <CommandItem>Settings</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
  },
};
