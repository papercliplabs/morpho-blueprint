import clsx from "clsx";

import { Avatar, type AvatarProps } from "@/components/ui/avatar";
import { cn } from "@/utils/shadcn";

type AvatarGroupProps = {
  avatars: Omit<AvatarProps, "size">[];
  max?: number;
  size?: AvatarProps["size"];
  showOverflow?: boolean;
  avatarClassName?: string;
} & React.ComponentProps<"div">;

const spacing: Record<Exclude<AvatarProps["size"], undefined | null>, string> = {
  "2xs": "-ml-2",
  xs: "-ml-2",
  sm: "-ml-2",
  md: "-ml-3",
  lg: "-ml-4",
  xl: "-ml-5",
};

export default function AvatarGroup({
  avatarClassName,
  avatars: allAvatars,
  className,
  max = 6,
  size = "md",
  showOverflow = true,
}: AvatarGroupProps) {
  const avatars = allAvatars.slice(0, max);
  const remaining = allAvatars.length - avatars.length;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        {avatars.map((avatarProps, index) => (
          <Avatar
            // biome-ignore lint/suspicious/noArrayIndexKey: No suitable key
            key={index}
            {...avatarProps}
            size={size}
            className={clsx(index > 0 && spacing[size ?? "md"], "border-1 border-background", avatarClassName)}
          />
        ))}
      </div>
      {remaining > 0 && showOverflow && <span className="text-muted-foreground">+{remaining}</span>}
    </div>
  );
}
