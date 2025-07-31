import { ButtonSelector } from "../ui/button-selector/button-selector";

interface Props {
  currency: string;
  setCurrency: (currency: string) => void;
  underlyingAssetSymbol: string;
}

export function CurrencySelector(props: Props) {
  const { underlyingAssetSymbol, currency, setCurrency } = props;

  return (
    <div className="flex justify-end">
      <ButtonSelector options={[underlyingAssetSymbol, "USD"]} selected={currency} setSelected={setCurrency} />
    </div>
  );
}
