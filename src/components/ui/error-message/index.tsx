export function ErrorMessage({ message }: { message?: string | null }) {
  return (
    <>
      {message && <p className="body-small wrap-break-word max-h-[40px] overflow-y-auto text-destructive">{message}</p>}
    </>
  );
}
