"use client";

import { useForm } from "react-hook-form";

import { SliderInputFormField } from "./Forms/FormFields/SliderInputFormField";
import { Button } from "./ui/button";
import { Form } from "./ui/form";

function Test() {
  const form = useForm();

  return (
    <Form {...form}>
      <div className="flex gap-2">
        <Button variant="destructive" onClick={() => form.setError("testing", { message: "Bad news, boyo." })}>
          Show Error :_
        </Button>
        <Button onClick={() => form.clearErrors()}>Clear Errors</Button>
      </div>
      <SliderInputFormField labelContent="Hello" sliderMin={1} sliderMax={6} name="testing" sliderStep={1} unit="x" />
    </Form>
  );
}

export { Test };
