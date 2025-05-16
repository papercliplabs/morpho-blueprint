export function ErrorMessage({ message }: { message?: string | null }) {
  return (
    <>
      {message && <p className="body-small text-destructive max-h-[40px] overflow-y-auto wrap-break-word">{message}</p>}
    </>
  );
}
