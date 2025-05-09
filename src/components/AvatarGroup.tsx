import clsx from "clsx";

import { cn } from "@/utils/shadcn";

import Avatar, { AvatarProps } from "./ui/avatar";

type AvatarGroupProps = {
  avatars: Omit<AvatarProps, "size">[];
  max?: number;
  size?: AvatarProps["size"];
  showOverflow?: boolean;
} & React.ComponentProps<"div">;

const spacing: Record<Exclude<AvatarProps["size"], undefined | null>, string> = {
  xsmall: "-ml-2",
  small: "-ml-2",
  medium: "-ml-3",
  large: "-ml-4",
  xlarge: "-ml-5",
};

export default function AvatarGroup({
  avatars: allAvatars,
  className,
  max = 6,
  size = "medium",
  showOverflow = true,
}: AvatarGroupProps) {
  const avatars = allAvatars.slice(0, max);
  const remaining = allAvatars.length - avatars.length;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        {avatars.map((avatarProps, index) => (
          <Avatar
            key={index}
            {...avatarProps}
            size={size}
            className={clsx(index > 0 && spacing[size ?? "medium"], "border-background border-2")}
          />
        ))}
      </div>
      {remaining > 0 && showOverflow && <span className="text-muted-foreground">+{remaining}</span>}
    </div>
  );
}
