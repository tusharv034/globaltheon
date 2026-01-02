import { Check } from "lucide-react";

export function DoneStep() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-xl font-semibold">DONE</h2>
      </div>

      <p className="text-gray-900 font-medium">
        You are all set. Payments will be made per your selections.
      </p>

      <div className="text-sm text-gray-600 space-y-2">
        <p>
          If you want to review your information, press the back button to review previous steps.
        </p>
        <p>
          If you wish to edit any details, click the edit button on the appropriate form. After editing please proceed through all the steps again until this final step confirmation.
        </p>
      </div>
    </div>
  );
}
