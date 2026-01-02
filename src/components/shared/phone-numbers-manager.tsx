import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Star, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

export interface PhoneNumber {
  type: "home" | "work" | "mobile" | "other";
  number: string;
  is_primary: boolean;
}

interface PhoneNumbersManagerProps {
  phoneNumbers: PhoneNumber[];
  onChange: (phoneNumbers: PhoneNumber[]) => void;
}

export function PhoneNumbersManager({ phoneNumbers, onChange }: PhoneNumbersManagerProps) {
  const [newPhoneType, setNewPhoneType] = useState<PhoneNumber["type"]>("mobile");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<PhoneNumber["type"]>("mobile");
  const [editingNumber, setEditingNumber] = useState("");

  const handleAddPhone = () => {
    if (!newPhoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\d\s\-+\(\)]+$/;
    if (!phoneRegex.test(newPhoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const newPhone: PhoneNumber = {
      type: newPhoneType,
      number: newPhoneNumber.trim(),
      is_primary: phoneNumbers.length === 0, // First phone is primary by default
    };

    onChange([...phoneNumbers, newPhone]);
    setNewPhoneNumber("");
    setNewPhoneType("mobile");
  };

  const handleRemovePhone = (index: number) => {
    const updatedPhones = phoneNumbers.filter((_, i) => i !== index);
    
    // If we removed the primary phone, make the first remaining phone primary
    if (phoneNumbers[index].is_primary && updatedPhones.length > 0) {
      updatedPhones[0].is_primary = true;
    }
    
    onChange(updatedPhones);
  };

  const handleSetPrimary = (index: number) => {
    const updatedPhones = phoneNumbers.map((phone, i) => ({
      ...phone,
      is_primary: i === index,
    }));
    onChange(updatedPhones);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingType(phoneNumbers[index].type);
    setEditingNumber(phoneNumbers[index].number);
  };

  const handleSaveEdit = (index: number) => {
    if (!editingNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    const phoneRegex = /^[\d\s\-+\(\)]+$/;
    if (!phoneRegex.test(editingNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const updatedPhones = [...phoneNumbers];
    updatedPhones[index] = {
      ...updatedPhones[index],
      type: editingType,
      number: editingNumber.trim(),
    };
    onChange(updatedPhones);
    setEditingIndex(null);
    toast.success("Phone number updated");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingType("mobile");
    setEditingNumber("");
  };

  const getPhoneTypeLabel = (type: PhoneNumber["type"]) => {
    const labels = {
      home: "Home",
      work: "Work",
      mobile: "Mobile",
      other: "Other",
    };
    return labels[type];
  };

  return (
    <div className="space-y-4">
      <Label>Phone Numbers</Label>
      
      {/* Existing phone numbers */}
      <div className="space-y-2">
        {phoneNumbers.map((phone, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-3 border rounded-md bg-muted/30"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={phone.is_primary ? "text-yellow-500" : "text-muted-foreground"}
              onClick={() => handleSetPrimary(index)}
              title="Set as primary"
            >
              <Star className={`h-4 w-4 ${phone.is_primary ? "fill-current" : ""}`} />
            </Button>
            
            {editingIndex === index ? (
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Select value={editingType} onValueChange={(value: any) => setEditingType(value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={editingNumber}
                  onChange={(e) => setEditingNumber(e.target.value)}
                  placeholder="Phone number"
                  className="col-span-2 h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveEdit(index);
                    }
                    if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium capitalize">
                  {getPhoneTypeLabel(phone.type)}
                </span>
                <span className="col-span-2 text-sm">{phone.number}</span>
              </div>
            )}

            {editingIndex === index ? (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEdit}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSaveEdit(index)}
                  className="text-primary"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStartEdit(index)}
                  className="text-muted-foreground"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePhone(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new phone number */}
      <div className="flex gap-2 items-end">
        <div className="w-32">
          <Label htmlFor="phone-type" className="text-xs">Type</Label>
          <Select value={newPhoneType} onValueChange={(value: any) => setNewPhoneType(value)}>
            <SelectTrigger id="phone-type" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Label htmlFor="phone-number" className="text-xs">Number</Label>
          <Input
            id="phone-number"
            value={newPhoneNumber}
            onChange={(e) => setNewPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPhone();
              }
            }}
          />
        </div>

        <Button
          type="button"
          onClick={handleAddPhone}
          size="sm"
          className="h-9"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {phoneNumbers.length === 0 && (
        <p className="text-sm text-muted-foreground">No phone numbers added yet</p>
      )}
    </div>
  );
}

