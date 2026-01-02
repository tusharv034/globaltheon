export function getDateFormatString(region: string, variant: string): string {
  switch (region) {
    case "US":
      switch (variant) {
        case "short":
          return "MM/dd/yyyy";
        case "long":
          return "MMMM dd, yyyy";
        case "datetime":
          return "MM/dd/yyyy, hh:mm a";
        case "custom":
          return "MMM dd, yyyy";
        default:
          return "MM/dd/yyyy";
      }
    
    case "UK":
      switch (variant) {
        case "short":
          return "dd/MM/yyyy";
        case "long":
          return "dd MMMM yyyy";
        case "datetime":
          return "dd/MM/yyyy, HH:mm";
        case "custom":
          return "MMM dd, yyyy";
        default:
          return "dd/MM/yyyy";
      }
    
    case "EU":
      switch (variant) {
        case "short":
          return "dd.MM.yyyy";
        case "long":
          return "dd MMMM yyyy";
        case "datetime":
          return "dd.MM.yyyy, HH:mm:ss";
        case "custom":
          return "MMM dd, yyyy";
        default:
          return "dd.MM.yyyy";
      }
    
    case "IN":
      switch (variant) {
        case "short":
          return "dd-MM-yyyy";
        case "long":
          return "dd MMMM yyyy";
        case "datetime":
          return "dd/MM/yyyy, HH:mm";
        case "custom":
          return "MMM dd, yyyy";
        default:
          return "dd-MM-yyyy";
      }
    
    default: // Worldwide (default)
      switch (variant) {
        case "short":
          return "yyyy-MM-dd";
        case "long":
          return "MMMM dd, yyyy";
        case "datetime":
          return "yyyy-MM-dd'T'HH:mm:ss";
        case "custom":
          return "MMM dd, yyyy";
        default:
          return "yyyy-MM-dd";
      }
  }
}