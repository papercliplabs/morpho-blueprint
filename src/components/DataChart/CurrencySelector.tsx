"use client";
import { useEffect } from "react";
import { ButtonSelector } from "../ui/button-selector/button-selector";

interface Props {
  currency: string;
  setCurrency: (currency: string) => void;
  underlyingAssetSymbol: string;
}

export function CurrencySelector(props: Props) {
  const { underlyingAssetSymbol, currency, setCurrency } = props;

  // If the underlying asset changes, and the currency is not USD update to the underlying asset
  useEffect(() => {
    if (currency !== "USD") {
      setCurrency(underlyingAssetSymbol);
    }
  }, [underlyingAssetSymbol, currency, setCurrency]);

  return (
    <div className="flex justify-end">
      <ButtonSelector options={[underlyingAssetSymbol, "USD"]} selected={currency} setSelected={setCurrency} />
    </div>
  );
}
