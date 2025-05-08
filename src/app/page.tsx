import Minus from "@/components/ui/icons/Minus";
import Plus from "@/components/ui/icons/Plus";
import PoweredByMorpho from "@/components/ui/icons/PoweredByMorpho";
import Sparkles from "@/components/ui/icons/Sparkles";

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
        <PoweredByMorpho />
        <Sparkles className="size-[64px]" />
        <Plus className="size-[64px]" />
        <Minus className="size-[64px]" />
      </main>
    </div>
  );
}
