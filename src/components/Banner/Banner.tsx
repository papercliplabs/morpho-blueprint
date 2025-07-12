import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config";
import { cn } from "@/utils/shadcn";
import { LinkExternalUnstyled } from "../LinkExternal";

export function Banner() {
  if (!APP_CONFIG.ui.banner) {
    return null;
  }

  const { text, button } = APP_CONFIG.ui.banner;
  const hasButton = button !== undefined;

  return (
    <div className="w-full bg-primary">
      <div
        className={cn("mx-auto flex max-w-[1182px] items-center px-4 py-2 text-primary-foreground", {
          "justify-between gap-4": hasButton,
          "justify-center": !hasButton,
        })}
      >
        <p className="body-medium line-clamp-2">{text}</p>
        {hasButton && (
          <LinkExternalUnstyled href={button.href} className="no-underline">
            <Button variant="secondary" size="sm">
              {button.text}
            </Button>
          </LinkExternalUnstyled>
        )}
      </div>
    </div>
  );
}
