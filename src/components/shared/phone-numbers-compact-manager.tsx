import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, Plus, Trash2, Star, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { createPhoneNumber, deletePhoneNumber, updatePhoneNumberPrimary, updatePhoneNumbers } from "@/api/customer";
import { createAffiliatePhoneNumber, updateAffiliatePhoneNumberPrimary, deleteAffiliatePhoneNumber, updateAffiliatePhoneNumbers } from "@/api/affiliate"

export interface PhoneNumber {
  type: "home" | "work" | "mobile" | "other";
  number: string;
  isPrimary: boolean;
}

interface PhoneNumbersCompactManagerProps {
  customerId: string,
  phoneNumbers: PhoneNumber[];
  onChange: (phoneNumbers: PhoneNumber[]) => void;
  disabled?: boolean;
}

export function PhoneNumbersCompactManager({ customerId, affiliateMongoId, phoneNumbers, onChange, disabled = false }: PhoneNumbersCompactManagerProps) {
  //  state to toggle the dropdown
  const [isOpen, setIsOpen] = useState(false);
  // state to store the index being changed
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // state to store the new number
  const [editingNumber, setEditingNumber] = useState("");
  // state to store the editing type of the number bein edited
  const [editingType, setEditingType] = useState<PhoneNumber["type"]>("mobile");
  // state to store if adding new number
  const [addingNew, setAddingNew] = useState(false);
  // state to store the new Type of the new number
  const [newType, setNewType] = useState<PhoneNumber["type"]>("mobile");
  // state to store new number
  const [newNumber, setNewNumber] = useState("");

  // when adding new number, these are the types that are returned that we can save
  const getPhoneTypeLabel = (type: PhoneNumber["type"]) => {
    const labels = {
      home: "Home",
      work: "Work",
      mobile: "Mobile",
      other: "Other",
    };
    return labels[type];
  };

  // store the primaryPhone
  const primaryPhone = phoneNumbers?.find((p) => p?.isPrimary || false);
  // deduce the text displatyes
  const displayText = primaryPhone
    ? `${primaryPhone?.number} (${phoneNumbers?.length} total)`
    : phoneNumbers?.length > 0
      ? `${phoneNumbers[0]?.number} (${phoneNumbers?.length} total)`
      : "No phone numbers";


  const createPhoneNumbersMutation = useMutation({
    mutationFn: async (payload: any) => await createPhoneNumber(payload),

    onSuccess: (response) => {
      onChange(response.data.data);
    },

    onError: (error) => {
      console.log("error is ", error);
    }
  });

  //for affiliate create phone number
  const createAffiliatePhoneNumbersMutation = useMutation({
    mutationFn: async (payload: any) => await createAffiliatePhoneNumber(payload),
    onSuccess: (response) => {
      onChange(response.data.data);
    },

    onError: (error) => {
      console.log("error is ", error);
    }
  })

  // function to add the new number
  const handleAddPhone = async () => {
    if (!newNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    const phoneRegex = /^[\d\s\-+\(\)]+$/;
    if (!phoneRegex.test(newNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const newPhone: PhoneNumber = {
      type: newType,
      number: newNumber.trim(),
      isPrimary: phoneNumbers.length === 0,
    };
  
    if (customerId !== undefined) {
      const payload = {
        customerId,
        ...newPhone
      }
    
      await createPhoneNumbersMutation.mutateAsync(payload);
    }
    else {
      const payload = {
        affiliateId: affiliateMongoId,
        ...newPhone
      }
 

      await createAffiliatePhoneNumbersMutation.mutateAsync(payload);
    }



    // onChange([...phoneNumbers, newPhone]);

    setNewNumber("");
    setNewType("mobile");
    setAddingNew(false);
    toast.success("Phone number added");
    return;
  };

  const updatePhoneNumberPrimaryMutation = useMutation({
    mutationFn: (payload: any) => updatePhoneNumberPrimary(payload),

    onSuccess: (response) => {
    
    },

    onError: (error) => {
      console.log("error is ", error);
    }
  });

  //affiliate update primary number mutation
  const updateAffiliatePhoneNumberPrimaryMutation = useMutation({
    mutationFn: (payload: any) => updateAffiliatePhoneNumberPrimary(payload),

    onSuccess: (response) => {
     
    },

    onError: (error) => {
      console.log("error is ", error);
    }
  })

  // update the number to primary
  const handleSetPrimary = async (index: number) => {
    if (customerId !== undefined) {
      const payload = {
        customerId,
        number: phoneNumbers[index].number,
        isPrimary: !(phoneNumbers[index].isPrimary)
      }

      await updatePhoneNumberPrimaryMutation.mutateAsync(payload);
      const updatedPhones = phoneNumbers.map((phone, i) => ({
        ...phone,
        isPrimary: i === index,
      }));
      onChange(updatedPhones);
    }
    else {
      const payload = {
        affiliateId: affiliateMongoId,
        number: phoneNumbers[index].number,
        isPrimary: !(phoneNumbers[index].isPrimary)
      }

      await updateAffiliatePhoneNumberPrimaryMutation.mutateAsync(payload);
      const updatedPhones = phoneNumbers.map((phone, i) => ({
        ...phone,
        isPrimary: i === index,
      }));
      onChange(updatedPhones);
    }


  };




  const updatePhoneNumbersMutation = useMutation({
    mutationFn: (payload: any) => updatePhoneNumbers(payload),

    onSuccess: (response) => {
     
      onChange(response.data.data);
    },

    onError: (error) => {
      console.log("error is ", error);
    }
  });

  //updateAffiliatePhoneNumber
  const updateAffiliatePhoneNumbersMutation = useMutation({
    mutationFn: (payload: any) => updateAffiliatePhoneNumbers(payload),

    onSuccess: (response) => {
    
      onChange(response.data.data);
    },

    onError: (error) => {
      console.log("error is ", error);
    }
  })

  // function triggered when start editing
  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingNumber(phoneNumbers[index].number);
    setEditingType(phoneNumbers[index].type);
  };

  // cancel editing the number
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingNumber("");
    setEditingType("mobile");
  };

  // function triggered when saving the updated number
  const handleSaveEdit = async (index: number) => {
    // return;
    if (editingNumber === phoneNumbers[index].number && editingType === phoneNumbers[index].type) {
      toast.error("Please update the phone number")
      return;
    }

    if (!editingNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    const phoneRegex = /^[\d\s\-+\(\)]+$/;
    if (!phoneRegex.test(editingNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }


    if (customerId !== undefined) {
      const payload = {
        numberId: phoneNumbers[index]._id,
        customerId,
        number: editingNumber,
        type:editingType
      }

      await updatePhoneNumbersMutation.mutateAsync(payload);
      // return;

      // const updatedPhones = [...phoneNumbers];
      // updatedPhones[index] = {
      //   ...updatedPhones[index],
      //   number: editingNumber.trim(),
      //   type: editingType
      // };
      // onChange(updatedPhones);
      setEditingIndex(null);
    }
    else {
      const payload = {
        numberId: phoneNumbers[index]._id,
        affiliateId:affiliateMongoId,
        number: editingNumber,
        type:editingType
      }

      await updateAffiliatePhoneNumbersMutation.mutateAsync(payload);
      // return;

      // const updatedPhones = [...phoneNumbers];
      // updatedPhones[index] = {
      //   ...updatedPhones[index],
      //   number: editingNumber.trim(),
      //   type: editingType
      // };
      // onChange(updatedPhones);
      setEditingIndex(null);
    }
    toast.success("Phone number updated");
  };

  const deletePhoneNumbersMutation = useMutation({
    mutationFn: async (payload: any) => await deletePhoneNumber(payload),

    onSuccess: (response) => {
     
    },

    onError: (error) => {
      console.log("error is ", error);
    }
  });

  //delete/remove  affiliate phone number
  const deleteAffiliatePhoneNumbersMutation = useMutation({
    mutationFn: async (payload: any) => await deleteAffiliatePhoneNumber(payload),

    onSuccess: (response) => {
      
    },

    onError: (error) => {
      console.log("error is ", error);
    }
  })

  // remove phone number
  const handleRemovePhone = async (index: number) => {


    if (customerId !== undefined) {
      const payload = {
        customerId,
        numberId: phoneNumbers[index]._id
      }

      await deletePhoneNumbersMutation.mutateAsync(payload);
      const updatedPhones = phoneNumbers.filter((_, i) => i !== index);

      if (phoneNumbers[index].isPrimary && updatedPhones.length > 0) {
        updatedPhones[0].isPrimary = true;
      }

      onChange(updatedPhones);

    }
    else {
      const payload = {
        affiliateId: affiliateMongoId,
        numberId: phoneNumbers[index]._id
      }

      await deleteAffiliatePhoneNumbersMutation.mutateAsync(payload);
      const updatedPhones = phoneNumbers.filter((_, i) => i !== index);

      if (phoneNumbers[index].isPrimary && updatedPhones.length > 0) {
        updatedPhones[0].isPrimary = true;
      }

      onChange(updatedPhones);

    }
    toast.success("Phone number removed");
    return;
  };


  return (
    <div className="space-y-2">
      <Label>Phone Numbers</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {/* single line showing the primary number */}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-10 font-normal"
            type="button"
          >
            <span className="truncate">{displayText}</span>
            <Phone className="h-4 w-4 ml-2 flex-shrink-0" />
          </Button>
        </PopoverTrigger>

        {/* DropDown showing both the numbers */}
        <PopoverContent className="w-80 bg-popover z-50" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Manage Phone Numbers</h4>
              {!addingNew && !disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddingNew(true)}
                  className="h-7"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {/* Add new phone form */}
            {addingNew && (
              <div className="space-y-2 p-2 border rounded-md bg-muted/30">
                <div className="flex gap-2">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PhoneNumber["type"])}
                    className="h-8 px-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="mobile">Mobile</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                  <Input
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="Phone number"
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPhone();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-1 justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAddingNew(false);
                      setNewNumber("");
                    }}
                    className="h-7"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddPhone}
                    className="h-7"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Existing phone numbers */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {phoneNumbers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No phone numbers added
                </p>
              ) : (
                phoneNumbers?.map((phone, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 border rounded-md bg-background"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${phone?.isPrimary ? "text-yellow-500" : "text-muted-foreground"}`}
                      onClick={() => handleSetPrimary(index)}
                      title="Set as primary"
                      disabled={disabled}
                    >
                      <Star className={`h-3 w-3 ${phone?.isPrimary ? "fill-current" : ""}`} />
                    </Button>

                    <div className="flex-1 min-w-0">
                      {editingIndex === index ? (
                        <div className="space-y-1">
                          <select
                            value={editingType}
                            onChange={(e) => setEditingType(e.target.value as PhoneNumber["type"])}
                            className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                          >
                            <option value="mobile">Mobile</option>
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </select>
                          <Input
                            value={editingNumber}
                            onChange={(e) => setEditingNumber(e.target.value)}
                            className="h-7 text-sm"
                            placeholder="Phone number"
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
                        <>
                          <div className="text-xs font-medium capitalize text-muted-foreground">
                            {getPhoneTypeLabel(phone?.type)}
                          </div>
                          <div className="text-sm truncate">{phone?.number}</div>
                        </>
                      )}
                    </div>

                    {editingIndex === index ? (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEdit}
                          className="h-7 w-7"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSaveEdit(index)}
                          className="h-7 w-7"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      !disabled && (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(index)}
                            className="h-7 w-7"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePhone(index)}
                            className="h-7 w-7 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
