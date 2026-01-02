import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AddressStepProps {
  data: {
    type: string;
    contactEmail: string;
    phoneNumber: string;
    firstName: string;
    middleName: string;
    lastName: string;
    country: string;
    streetAddress: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
  };
  onChange?: (data: AddressStepProps["data"]) => void;
}

export function AddressStep({ data, onChange }: AddressStepProps) {
  const handleChange = (field: keyof AddressStepProps["data"], value: string) => {
    if (onChange) {
      onChange({ ...data, [field]: value });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Enter Your Information</h2>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            To ensure that you receive your payments on time, please enter your details as you shared them with your bank. P.O. Box not allowed.
          </p>
        </div>
      </div>

      <div className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-4">
          <div>
            <Label className="font-semibold">Type</Label>
            <Input
              value={data.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">Contact Email</Label>
            <Input
              type="email"
              value={data.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold flex items-center gap-1">
              Phone Number <Info className="h-3 w-3" />
            </Label>
            <Input
              value={data.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold flex items-center gap-1">
              First Name <Info className="h-3 w-3" />
            </Label>
            <Input
              value={data.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">Middle Name</Label>
            <Input
              value={data.middleName}
              onChange={(e) => handleChange("middleName", e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold flex items-center gap-1">
              Last Name <Info className="h-3 w-3" />
            </Label>
            <Input
              value={data.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">Country</Label>
            <Input
              value={data.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">Street Address</Label>
            <Input
              value={data.streetAddress}
              onChange={(e) => handleChange("streetAddress", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">Address 2</Label>
            <Input
              value={data.address2}
              onChange={(e) => handleChange("address2", e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">City</Label>
            <Input
              value={data.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">State</Label>
            <Input
              value={data.state}
              onChange={(e) => handleChange("state", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-semibold">ZIP</Label>
            <Input
              value={data.zip}
              onChange={(e) => handleChange("zip", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
