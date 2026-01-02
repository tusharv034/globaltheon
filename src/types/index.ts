export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

type UserPermissions = {
  module: string,
  section: string,
  permission: "view" | "edit" | "none"
}

export interface User {
  addressLineOne: string,
  addressLineTwo: string,
  affiliateId?: string,
  status: string,
  kycPass: boolean,
  taxId: string,
  _id: string,
  email: string,
  firstName: string,
  lastName: string,
  avatarHexColor: string,
  avatarInitials: string,
  profilePictureUrl: string,
  cityTown: string,
  stateProvince: string,
  country: string,
  zipPostal: string,
  role: string,
  roleLabel: string,
  permissions: UserPermissions[],
  createdAt: string,
  updatedAt: string,
}

export type LoginPayload = {
  email: string,
  password: string,
};

export type LoginResponse = {
  token: string,
  user: User,
};

export type ResetUserPasswordPayload = {
  user: User
}

export type ResetUserPasswordResponse = {
  user: User
}

export type ResetPasswordPayload = {
  email: string,
  domainName: string,
};

export type UpdateUserPayload = {
  avatarInitials?: string,
  avatarHexColor?: string,
  addressLineOne?: string,
  cityTown?: string,
  country?: string,
  email?: string,
  firstName?: string,
  lastName?: string,
  stateProvince?: string,
  zipPostal?: string,
}

export type UpdateUserResponse = {
  avatarInitials?: string,
  avatarHexColor?: string,
  addressLineOne?: string,
  cityTown?: string,
  country?: string,
  email?: string,
  firstName?: string,
  lastName?: string,
  stateProvince?: string,
  zipPostal?: string,
}

export type OrderResponse = {
  _id: string;
  shopifyOrderId: string;
  orderId: string;
  orderBy: string;
  orderStatus: number;
  orderDate: string; // Consider using `Date` if needed
  amount: number;
  subscription: boolean;
  selfCustomerAffiliateId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  level1AffiliateName: string;
  level2AffiliateName: string;
  level1AffiliateId: string;
  level2AffiliateId: string;
};
export type OrdersDataResponse = {
  orders: OrderResponse[]; // List of orders
  pagination: Pagination;  // Pagination details
};

export type UpdateUserPasswordPayload = {
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
}

export type UpdateUserPasswordResponse = {
  currentPassword?: string,
  newPassword?: string,
  confirmPassword?: string
}

export interface AuthStore {
  token: string | null,
  user: User | null,
  impersonating: boolean,
  setAuth: (token: string, user: User, impersonating: boolean) => void,
  updateAuthUser: (updates: Partial<User>) => void,  // Generic!
  clearAuth: () => void,
}

export type ReadCompanyResponse = {
  addressLineOne: string | null;
  addressLineTwo: string | null;
  city: string | null;
  companyCountryCode: string | null;
  companyEmail: string;
  companyName: string;
  companyPhone: string | null;
  country: string | null;
  hoursOfOperation: string | null;
  logoUrl: string | null;
  ownerFirstName: string;
  ownerLastName: string;
  stateProvince: string | null;
  supportEmail: string | null;
  zipPostal: string | null;
};

export type CompanySettingResponse = {
  companyName: string | null,
  ownerFirstName: string | null,
  ownerLastName: string | null,
  companyEmail: string | null,
  supportEmail: string | null,
  companyPhone: string | null,
  companyCountryCode: string | null,
  addressLineOne: string | null,
  addressLineTwo: string | null,
  city: string | null,
  stateProvince: string | null,
  zipPostal: string | null,
  country: string | null,
  logoUrl: string | null,
  hoursOfOperation: string | null,
}

export type CompanySettingPayload = {
  companyName: string,
  ownerFirstName: string,
  ownerLastName: string,
  addressLineOne?: string | null,
  addressLineTwo?: string | null,
  companyEmail?: string | null,
  supportEmail?: string | null,
  companyPhone?: string | null,
  city?: string | null,
  stateProvince?: string | null,
  postalCode?: string | null,
  hoursOfOperation?: string | null,
}


export type CompanySocialsResponse = {
  facebookUrl: string | null,
  xUrl: string | null,
  instagramUrl: string | null,
  youtubeUrl: string | null
}

export type CompanySocialsPayload = {
  facebookUrl: string | null,
  xUrl: string | null,
  instagramUrl: string | null,
  youtubeUrl: string | null
}

export type CompensationPlanResponse = {
  numLevels: number | null,
  levelPercentage: { [key: string]: number } | null;
  defaultRankName: string,
  createdAt: string,
  updatedAt: string
}

export type CompensationPlanPayload = {
  numLevels: number | null,
  levelPercentage: { [key: string]: number } | null;
  defaultRankName: string
}

// Type for each integration's configuration, allowing any key-value pairs
export type IntegrationConfig = {
  [key: string]: any;  // This will allow any property with any value type
};

// Type for each integration
export type Integration = {
  integrationName: string;
  isEnabled: boolean;
  config: IntegrationConfig;
  timestamp: string;   // ISO 8601 timestamp format
  _id: string;         // Unique identifier for each integration
};

// Type for the overall response
export type IntegrationsResponse = Integration[];

export type IntegrationsPayload = {
  integrationName: string;
  config: IntegrationConfig;
};



export type MasterEmailResponse = {
  headerHtml: string,
  footerHtml: string,
  isEnabled: boolean
}

export type MasterEmailPayload = {
  headerHtml: string,
  footerHtml: string,
  isEnabled: boolean | null
}
export type EmailTemplate = {
  _id: string;
  templateName: string;
  templateId: string;
  description: string | null;
  category: string | null;
  subject: string;
  emailContent: string;
  isActive: boolean;
  includeMasterTemplate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// This is the REAL shape your backend returns
export type EmailTemplatesResponse = {
  data: EmailTemplate[];
  pagination: Pagination;
};
export interface GetEmailTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

export type createNewTemplatePayload = {
  templateName: string;
  templateId: string;
  description?: string;
  category: string;
  subject: string;
  emailContent: string;
  isActive: boolean;
  includeMasterTemplate: boolean;
};


export type UpdateTemplatePayload = {
  templateName?: string;
  templateId?: string;
  description?: string;
  category?: string;
  subject?: string;
  emailContent?: string;
  isActive?: boolean;
  includeMasterTemplate?: boolean;
};


export type SendTestEmailPayload = {
  subject: string;
  htmlContent: string;
  useMasterTemplate: boolean;
  testEmail: string;
}
export interface PhoneNumber {
  number: string;
  type?: "home" | "mobile" | "work" | "other";
  isPrimary?: boolean;
}

export interface EnrollingAffiliate {
  affiliate_id: string;
  first_name: string;
  last_name: string;
  email?: string;
}
export interface Customer {
  // Core identifiers
  id: string;                    // MongoDB _id as string
  customer_id: string;           // selfCustomerId padded (e.g., "200123")

  // Personal info
  first_name: string;
  last_name: string;
  email: string;

  // Contact
  phone: string | null;
  phone_numbers?: PhoneNumber[];

  // Address
  addressLineOne: string | null;
  addressLineTwo: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string;

  // Status & enrollment
  status: "active" | "inactive" | "cancelled" | "terminated";
  enrolled_by: string | null;    // affiliate's selfAffiliateId (number or string)
  created_at: string;            // ISO string

  // Order & purchase stats (from aggregation)
  order_count?: number;
  total_spent?: number;
  last_order_date?: string | null;     // ISO date string
  last_order_amount?: number;
  last_subscription_date?: string | null;

  // Affiliate info
  affiliate_name?: string | null;      // "John Doe"
  enrolling_affiliate?: EnrollingAffiliate | null;

  // Opt-out
  email_opted_out?: boolean;
  email_opted_out_at?: string | null;  // ISO string

  // Optional flags for UI navigation (not from backend)
  _fromNotes?: boolean;
}


export interface UpdateCustomerPayload {
  // Personal
  first_name?: string;
  last_name?: string;
  email?: string;

  // Contact
  phone?: string | null;
  phone_numbers?: PhoneNumber[];

  // Address
  addressLineOne?: string | null;
  addressLineTwo?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;

  // Status & enrollment
  status?: "active" | "inactive" | "cancelled" | "terminated";
  enrolled_by?: string | number | null;  // selfAffiliateId

  // Opt-out
  email_opted_out?: boolean;

  // Optional notes from frontend
  affiliateChangeNote?: string;
  passwordChangeNote?: string;
}

export interface UpdateCustomerResponse {
  success: boolean;
  message: string;
  data: Customer;
}



// Define the response types
export type Customer_Arr = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  enrolledBy: number;
  enrollmentDate: string;
  orderCount?: number;
  totalOrderAmount?: number;
  lastOrderDate?: Date | string | null;
  lastOrderId: string;
  selfCustomerId?:number;
}

export type GetAffiliateCustomerResponse = {
  success: boolean;
  message: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCustomers: number;
    hasNext: boolean,
    hasPrev: boolean
  }
  data: {
    customers: Customer_Arr[];
    affiliate: {
      _id: string;
      name: string;
      selfClientId: number;
    };
  };
}

export type SingleOrderResponse = {
  order: {
    _id: string;
    selfClientId?: number;
    shopifyOrderId?: string;
    orderId: string;
    orderBy: string;
    orderStatus: number;
    orderDate: string;
    amount: number;
    discountAmount?: number;
    subtotal?: number;
    shippingCost?: number;
    taxAmount?: number;
    amountPaid?: number;
    shoppingMethod?: string;
    salesTaxId?: string;
    paymentMethod?: string;
    subscription?: boolean;
    paymentDate?: string;
    cancelledDate?: string | null;
    refundedDate?: string | null;
    shippingAddress?: Record<string, any>;     // anything inside
    billingAddress?: Record<string, any>;
    billingSameAsShipping?: boolean;
    lineItems?: Array<Record<string, any>>;
    createdAt: string;
    updatedAt: string;
  };
  customer: {
    customerId?: string
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }
};