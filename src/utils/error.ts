class ErrorWithShortMessage extends Error {
  shortMessage: string;

  constructor(message: string, shortMessage: string) {
    super(message);
    this.shortMessage = shortMessage;

    Object.setPrototypeOf(this, ErrorWithShortMessage.prototype);
  }
}

// Utility to ensure a value is always an error
export function ensureError(value: unknown): Error & { shortMessage?: string } {
  if (value instanceof Error) return value;

  let stringified = "[Unable to stringify thrown value]";
  try {
    stringified = JSON.stringify(value);
  } catch {
    /* empty */
  }

  const shortMessage = stringified;
  const error = new ErrorWithShortMessage(
    `This value was thrown as is, not through an Error: ${stringified}`,
    shortMessage,
  );

  return error;
}
