import { Step, StepProps } from "./Step";

type StepsProps = {
  steps: StepProps[];
};

function Steps({ steps }: StepsProps) {
  return (
    <div className="flex flex-col gap-4">
      {steps.map((step, index) => (
        <Step key={index} {...step} />
      ))}
    </div>
  );
}

export { Steps };
