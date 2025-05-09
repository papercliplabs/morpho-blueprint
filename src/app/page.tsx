export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
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
      </main>
    </div>
  );
}
