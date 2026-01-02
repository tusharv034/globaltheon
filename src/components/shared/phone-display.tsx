import { useState } from "react";
import { Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import ringcentralLogo from "@/assets/ringcentral-logo.png";

export interface PhoneNumber {
  type: "home" | "work" | "mobile" | "other";
  number: string;
  isPrimary: boolean;
}

interface PhoneDisplayProps {
  phoneNumbers: PhoneNumber[];
}

// Format phone number for RingCentral (digits only, E.164 without plus)
const formatForRingCentral2 = (phoneNumber: string): string => {
  const digits = phoneNumber.replace(/\D/g, "");
  // If US number, make sure it starts with 1
  if (digits.length === 10) return `1${digits}`;
  return digits;
};

// Format phone number for RingCentral (digits only, E.164 without plus)
const formatForRingCentral = (phoneNumber: string | null): string => {
  // Handle null, undefined, or empty input
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return ''; // or return an error message if preferred
  }

  const digits = phoneNumber.replace(/\D/g, "");

  // If US number, make sure it starts with 1
  if (digits.length === 10) return `1${digits}`;

  return digits;
};


const isDesktop = () => !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const buildCandidates = (num: string) => {
  const enc = encodeURIComponent(num);
  const ts = Date.now();
  // Use RingCentral's recommended rcmobile scheme with a cache-busting param to ensure repeat invocations
  return [
    `rcmobile://call?number=${enc}&t=${ts}`,
    `tel:${num}`,
  ];
};

export function PhoneDisplay({ phoneNumbers }: PhoneDisplayProps) {
  const [selectedPhone, setSelectedPhone] = useState<PhoneNumber | null>(
    // {"number" : "1234567890", isPrimary: true, type: "other"} || phoneNumbers[0] || null
    phoneNumbers.length !== 0 && phoneNumbers?.find((p) => p?.isPrimary === true || true) || phoneNumbers[0] || null
  );
  const { toast } = useToast();

  if (!phoneNumbers || phoneNumbers.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const getPhoneTypeLabel = (type: PhoneNumber["type"]) => {
    const labels = {
      home: "Home",
      work: "Work",
      mobile: "Mobile",
      other: "Other",
    };
    return labels[type];
  };

  const handleCallButton = (phone: PhoneNumber, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const num = formatForRingCentral(phone.number);
 

    const candidates = buildCandidates(num);

    // Open a helper tab/window to ensure top-level user-gesture context
    let helper: Window | null = null;
    try {
      helper = window.open('', '_blank');
      if (!helper) {
        console.warn('⚠️ Popup blocked');
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site to use the Call button.",
          variant: "destructive",
        });
        return;
      }
      helper.document.title = 'Launching RingCentral…';
      helper.document.body.innerHTML = '<p style="font-family:system-ui;padding:20px;">Launching RingCentral… You can close this tab.</p>';
    } catch (err) {
      console.warn('⚠️ Unable to open helper window', err);
      toast({
        title: "Unable to Launch",
        description: "Please check your browser settings and allow popups.",
        variant: "destructive",
      });
      return;
    }

    let idx = 0;
    const tryNext = () => {
      if (idx >= candidates.length) {
        console.warn('⚠️ Exhausted all deep link candidates');
        if (helper && !helper.closed) {
          try { helper.close(); } catch {}
        }
        return;
      }
      const uri = candidates[idx++];
      console.log('🔵 Trying URI (helper):', uri);
      try {
        if (helper && !helper.closed) {
          helper.location.href = uri;
        }
      } catch (err) {
        console.warn('⚠️ Failed to navigate helper to', uri, err);
      }
      // Try next candidate shortly after in case protocol not handled
      setTimeout(tryNext, 350);
    };

    tryNext();
    setTimeout(() => { try { if (helper && !helper.closed) helper.close(); } catch {} }, 3500);
  };

  const handlePhoneClick = (phone: PhoneNumber, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleCallButton(phone, e);
  };

  if (phoneNumbers.length === 1) {
    const phone = phoneNumbers[0];
    const formattedNumber = formatForRingCentral(phone?.number);
    return (
      <div className="flex items-center gap-2">
        <a
          href={`tel:${formattedNumber}`}
          className="text-primary hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {phone?.number}
        </a>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCallButton(phone, e);
                }}
              >
                <img src={ringcentralLogo} alt="RingCentral" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Call with RingCentral</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={`tel:${formatForRingCentral((selectedPhone || phoneNumbers[0])?.number || "0000000000")}`}
        className="text-primary hover:underline cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {selectedPhone?.number || phoneNumbers[0]?.number}
      </a>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                handleCallButton(selectedPhone || phoneNumbers[0], e);
              }}
            >
              <img src={ringcentralLogo} alt="RingCentral" className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Call with RingCentral</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Phone className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover z-50">
          {phoneNumbers?.map((phone, index) => (
            <DropdownMenuItem
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhone(phone);
              }}
              className={selectedPhone?.number === phone?.number ? "bg-accent" : ""}
            >
              <div className="flex flex-col">
                <span className="font-medium capitalize text-xs">
                  {getPhoneTypeLabel(phone?.type)}
                </span>
                <span className="text-sm">{phone?.number}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
