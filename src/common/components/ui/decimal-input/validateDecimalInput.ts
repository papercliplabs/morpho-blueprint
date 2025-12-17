export function validateDecimalInput(value: string, decimals = 6) {
  const isValid = isValidDecimalInput(value, decimals);

  return { isValid, value: isValid ? normalizeDecimalInput(value) : value };
}

function isValidDecimalInput(value: string, decimals = 6): boolean {
  if (value === "") return true;
  return new RegExp(`^0*(\\d+)?(\\.\\d{0,${decimals}})?$`).test(value);
}

function normalizeDecimalInput(value: string): string {
  return value === "." ? "0." : value;
}
