import Link from "next/link";

import { Button } from "@/components/ui/button";
import { type AppConfig } from "@/config/types";
import { cn } from "@/utils/shadcn";

interface BannerProps {
  banner: NonNullable<AppConfig["banner"]>;
}

export function Banner(props: BannerProps) {
  const { text, button } = props.banner;

  const hasButton = button !== undefined;

  return (
    <div className={cn("bg-primary text-primary-foreground w-full flex items-center py-2 px-4 max-w-[1182px] mx-auto", {
      'justify-between gap-4': hasButton,
      'justify-center': !hasButton,
    })}>
      <p className="body-medium line-clamp-1">{text}</p>
      {hasButton && (
        <Link href={button.href}>
          <Button variant="secondary">{button.text}</Button>
        </Link>
      )}
    </div>
  );
}
