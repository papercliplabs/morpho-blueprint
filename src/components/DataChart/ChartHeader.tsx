import { cn } from "@/utils/shadcn";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "../ui/tooltip-popover";

type Props = {
  label: string;
  value: string;
  description?: string;
  currency?: string;
};

export function ChartHeader(props: Props) {
  const { label, description, currency, value } = props;

  const hasTooltip = !!description;

  const Label = () => (
    <dt
      className={cn("body-small-plus text-muted-foreground", {
        "underline decoration-dashed underline-offset-3": !!hasTooltip,
      })}
    >
      {label} {currency ? `(${currency})` : ""}
    </dt>
  );

  return (
    <dl>
      {hasTooltip ? (
        <TooltipPopover>
          <TooltipPopoverTrigger className="w-fit">
            <Label />
          </TooltipPopoverTrigger>
          <TooltipPopoverContent>{description}</TooltipPopoverContent>
        </TooltipPopover>
      ) : (
        <Label />
      )}

      <dd className="heading-4 mt-1">{value}</dd>
    </dl>
  );
}
