"use client";

import { useForm } from "react-hook-form";

import { AssetInputFormField } from "./Forms/FormFields/AssetInputFormField";
import { Button } from "./ui/button";
import { Form } from "./ui/form";

function Test() {
  const form = useForm();

  return (
    <Form {...form}>
      <div className="flex gap-2">
        <Button variant="destructive" onClick={() => form.setError("testing", { message: "Bad news, boyo." })}>
          Show Error
        </Button>
        <Button onClick={() => form.clearErrors()}>Clear Errors</Button>
      </div>
      <AssetInputFormField
        header="Hello world"
        asset={{ symbol: "USDC", priceUsd: 1.0, avatar: { fallback: "CN" } }}
        name="testing"
        maxValue={100}
      />
    </Form>
  );
}

export { Test };
