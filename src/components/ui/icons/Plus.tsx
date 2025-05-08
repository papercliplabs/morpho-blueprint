import clsx from "clsx";

export default function Plus({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(["fill-current", "stroke-background"], className)}
      {...props}
    >
      <rect x="1" y="1" width="14" height="14" rx="7" />
      <rect x="1" y="1" width="14" height="14" rx="7" strokeWidth="2" />
      <path d="M8 5.66675V10.3334" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.66663 8H10.3333" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
