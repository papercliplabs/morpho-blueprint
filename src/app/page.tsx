import AvatarGroup from "@/components/AvatarGroup";
import Avatar from "@/components/ui/avatar";
import Plus from "@/components/ui/icons/Plus";

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
        <div className="flex gap-1">
          <Avatar fallback="CN" size="xlarge" />
          <Avatar fallback="CN" size="large" />
          <Avatar fallback="CN" />
          <Avatar fallback="CN" size="small" />
          <Avatar fallback="CN" size="xsmall" />
          <Avatar src="https://github.com/shadcn.png" fallback="CN" size="xlarge" />
          <Avatar src="https://github.com/shadcn.png" fallback="CN" size="large" />
          <Avatar src="https://github.com/shadcn.png" fallback="CN" />
          <Avatar src="https://github.com/shadcn.png" fallback="CN" size="small" />
          <Avatar src="https://github.com/shadcn.png" fallback="CN" size="xsmall" />
          <Avatar src="https://github.com/shadcn.png" fallback="CN" sub={<Plus className="size-[12px]" />} />
        </div>
        <AvatarGroup
          size="small"
          avatars={[
            { src: "https://github.com/shadcn.png", fallback: "CN" },
            { src: "https://github.com/shadcn.png", fallback: "AB" },
            { src: "https://github.com/shadcn.png", fallback: "AB" },
            { src: "https://github.com/shadcn.png", fallback: "AB" },
            { src: "https://github.com/shadcn.png", fallback: "AB" },
            { src: "https://github.com/shadcn.png", fallback: "AB" },
            { src: "https://github.com/shadcn.png", fallback: "AB" },
            { src: "https://github.com/shadcn.png", fallback: "AB" },
            { src: "https://github.com/shadcn.png", fallback: "AB" },
            { src: "https://github.com/shadcn.png", fallback: "AB" },
          ]}
          max={2}
        />
        <h1 className="text-primary">heading-1</h1>
        <h2>heading-2</h2>
        <h3>heading-3</h3>
        <h4>heading-4</h4>
        <h5>heading-5</h5>
        <h6>heading-6</h6>
        <p className="body-large-plus">large-plus</p>
        <p className="body-large">large</p>
        <p className="body-medium-plus">medium-plus</p>
        <p className="body-medium">medium</p>
        <p className="body-small-plus">small-plus</p>
        <p className="body-small">small</p>
        <p className="text-primary">Testing 123</p>
      </main>
    </div>
  );
}
