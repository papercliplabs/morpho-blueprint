import { Input } from "../input";
import { validateDecimalInput } from "./validateDecimalInput";

interface DecimalInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type" | "inputMode"> {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  decimals?: number;
}

export function DecimalInput(props: DecimalInputProps) {
  const { decimals = 6, onChange, ...rest } = props;
  return (
    <Input
      placeholder="0.00"
      inputMode="decimal"
      type="text"
      onChange={(e) => {
        const { isValid, value } = validateDecimalInput(e.target.value, decimals);
        if (isValid) onChange({ ...e, target: { ...e.target, value } });
      }}
      {...rest}
    />
  );
}
