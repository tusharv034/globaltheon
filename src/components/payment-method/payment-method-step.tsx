import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PaymentMethodStepProps {
  data: {
    paymentMethod: string;
    nameOnAccount: string;
    bankName: string;
    routingCode: string;
    accountNumber: string;
    accountType: string;
    transactionFee: string;
  };
  onChange?: (data: PaymentMethodStepProps["data"]) => void;
}

export function PaymentMethodStep({ data, onChange }: PaymentMethodStepProps) {
  const handleChange = (field: keyof PaymentMethodStepProps["data"], value: string) => {
    if (onChange) {
      onChange({ ...data, [field]: value });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="font-semibold text-base">Payment Method:</Label>
          <Input
            value={data.paymentMethod}
            onChange={(e) => handleChange("paymentMethod", e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="h-px bg-gray-200 my-4" />

        <div className="space-y-4">
          <div>
            <Label className="font-semibold flex items-center gap-1">
              Name on Account <Info className="h-3 w-3" />
            </Label>
            <Input
              value={data.nameOnAccount}
              onChange={(e) => handleChange("nameOnAccount", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">Bank Name</Label>
            <Input
              value={data.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold flex items-center gap-1">
              Routing Code <Info className="h-3 w-3" />
            </Label>
            <Input
              value={data.routingCode}
              onChange={(e) => handleChange("routingCode", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">Account Number</Label>
            <Input
              value={data.accountNumber}
              onChange={(e) => handleChange("accountNumber", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">Account Type</Label>
            <Input
              value={data.accountType}
              onChange={(e) => handleChange("accountType", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="h-px bg-gray-200 my-4" />

        <div className="text-sm">
          <p className="text-gray-600">Transaction fees: {data.transactionFee}</p>
          <p className="text-gray-600 mt-2">
            See{" "}
            <a href="#" className="text-blue-600 underline">
              Tipalti's Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 underline">
              Tipalti's Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
