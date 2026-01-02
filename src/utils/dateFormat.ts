const dateFormatConfig = {
  US: {
    short: "MM/DD/YYYY",            // Example: 12/22/2025
    long: "MMMM D, YYYY",           // Example: December 22, 2025
    datetime: "MM/DD/YYYY, hh:mm A", // Example: 12/22/2025, 04:30 PM
    custom: "MMM D, YYYY"           // Example: Dec 22, 2025
  },
  UK: {
    short: "DD/MM/YYYY",            // Example: 22/12/2025
    long: "DD MMMM YYYY",           // Example: 22 December 2025
    datetime: "DD/MM/YYYY, HH:mm",  // Example: 22/12/2025, 16:30
    custom: "MMM D, YYYY"           // Example: Dec 22, 2025
  },
  EU: {
    short: "DD.MM.YYYY",            // Example: 22.12.2025
    long: "DD MMMM YYYY",           // Example: 22 December 2025
    datetime: "DD.MM.YYYY, HH:mm:ss", // Example: 22.12.2025, 16:30:00
    custom: "MMM D, YYYY"           // Example: Dec 22, 2025
  },
  IN: {
    short: "DD-MM-YYYY",            // Example: 22-12-2025
    long: "DD MMMM YYYY",           // Example: 22 December 2025
    datetime: "DD/MM/YYYY, HH:mm",  // Example: 22/12/2025, 16:30
    custom: "MMM D, YYYY"           // Example: Dec 22, 2025
  },
  // Default (Worldwide) format, for any region that is not US, UK, EU, IN
  default: {
    short: "yyyy-MM-dd",            // Example: 2025-12-22
    long: "MMMM d, yyyy",           // Example: December 22, 2025
    datetime: "yyyy-MM-dd'T'HH:mm:ss", // Example: 2025-12-22T16:30:00
    custom: "MMM d, yyyy"           // Example: Dec 22, 2025
  }
};

// Export the config
export default dateFormatConfig;
