import { VariantProps, cva } from "class-variance-authority";
import Link from "next/link";

const navItemVariants = cva(
  "text-muted-foreground hover:bg-accent group inline-flex h-9 items-center rounded-sm px-3 transition body-medium",
  {
    variants: {
      active: {
        true: "text-primary",
        false: "text-muted-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

type LinkProps = {
  href: string;
  name: string;
};

type NavItemProps = LinkProps & React.ComponentProps<typeof Link> & VariantProps<typeof navItemVariants>;

function NavItem({ className, active, href, name }: NavItemProps) {
  return (
    <Link href={href} className={navItemVariants({ className, active })}>
      <span className="transition group-active:scale-95">{name}</span>
    </Link>
  );
}

export { NavItem, type NavItemProps, type LinkProps };
