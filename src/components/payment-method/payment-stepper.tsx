import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  label: string;
  completed: boolean;
}

interface PaymentStepperProps {
  currentStep: number;
  steps: Step[];
}

export function PaymentStepper({ currentStep, steps }: PaymentStepperProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 font-semibold transition-colors",
                  step.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : currentStep === step.number
                    ? "bg-[#3b4a6b] border-[#3b4a6b] text-white"
                    : "bg-white border-gray-300 text-gray-400"
                )}
              >
                {step.completed ? (
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <span className="text-sm sm:text-base">{step.number}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs sm:text-sm font-medium text-center",
                  step.completed || currentStep === step.number
                    ? "text-gray-900"
                    : "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-300 mx-1 sm:mx-2 mb-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
