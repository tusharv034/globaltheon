// src/types/api/affiliate.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

// Affiliate type based on your backend response
export interface Affiliate {
  _id: string;
  selfAffiliateId: number;
  selfClientId: number;
  companyId: string;
  userId: string;

  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string;
  phone?: string;

  // Address Information
  addressLineOne?: string;
  addressLineTwo?: string;
  cityTown?: string;
  stateProvince?: string;
  zipPostal?: string;
  country?: string;

  // Enrollment Information
  enrolledBy: number;
  enrollmentDate: string;

  // Affiliate Specific Fields
  shopifyAffiliateId?: string;
  siteName?: string;
  status: string;
  statusChangedBy?: string;
  statusChangeReason?: string;
  statusChangedAt?: string;

  // Tax and Financial Information
  taxId?: string;
  totalSales: number;
  totalCommissions: number;
  allowAutomaticChargebacks: boolean;

  // KYC Information
  kycPass: boolean;
  kycSubmittedAt?: string;
  kycApprovedAt?: string;
  kycData?: Record<string, any>;
  kycRejectionReason?: string;

  // Communication Preferences
  tipaltiEnabled: boolean;
  emailOptedOut: boolean;
  emailOptedOutAt?: string;

  // Arrays
  phoneNumbers: PhoneNumber[];
  notes: Note[];
  purchaseCount:number | string;

  // Rank and Defaults
  rank: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;

  // Deletion Fields
  deletedAt?: string;
  deletedBy?: string;

  // Additional fields
  enroller?: Enroller;
  user?: User;
}

export interface PhoneNumber {
  number: string;
  type: string;
  isPrimary: boolean;
  verified: boolean;
}

export interface Note {
  text: string;
  type: string;
  metaData?: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enroller {
  selfAffiliateId: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  countryCode?: string;
  addressLineOne?: string;
  addressLineTwo?: string;
  cityTown?: string;
  stateProvince?: string;
  zipPostal?: string;
  country?: string;
  roleId: string;
}

// API Payload and Response Types

export type UpdateAffiliatePayload = {
  _id: string;
  companyId: string;
  // Personal Information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;

  // Address Information
  addressLineOne?: string;
  addressLineTwo?: string;
  cityTown?: string;
  stateProvince?: string;
  zipPostal?: string;
  country?: string;

  // Enrollment Information
  enrolledBy?: number;
  updatedBy: string;

  // Affiliate Specific Fields
  shopifyAffiliateId?: string;
  siteName?: string;
  status?: string;
  statusChangedBy?: string;
  statusChangeReason?: string;
  statusChangedAt?: string;

  // Tax and Financial Information
  taxId?: string;
  totalSales?: number;
  totalCommissions?: number;
  allowAutomaticChargebacks?: boolean;

  // KYC Information
  kycPass?: boolean;
  kycSubmittedAt?: string;
  kycApprovedAt?: string;
  kycData?: Record<string, any>;
  kycRejectionReason?: string;

  password?: string;
  passwordChangeReason?: string;

  // Communication Preferences
  tipaltiEnabled?: boolean;
  emailOptedOut?: boolean;
  emailOptedOutAt?: string;

  // Arrays
  phoneNumbers?: PhoneNumber[];
  notes?: Omit<Note, "createdAt" | "updatedAt">[];

  // Deletion Fields
  deletedAt?: string;
  deletedBy?: string;
};

export type UpdateAffiliateResponse = {
  affiliateId: number;
  affiliateRecord: {
    selfAffiliateId: number;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    rank: string;
    updatedAt: string;
  };
};

export type GetAffiliateResponse = Affiliate;

export type ListAffiliatesPayload = {
  companyId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Filters
  search?: string;
  selfAffiliateId?: string;
  affiliateSearch?:string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
  enrollmentDateFrom?: string;
  enrollmentDateTo?: string;
  totalSalesMin?: number;
  totalSalesMax?: number;
  totalCommissionsMin?: number;
  totalCommissionsMax?: number;
  kycPass?: boolean;
  tipaltiEnabled?: boolean;
  emailOptedOut?: boolean;
  allowAutomaticChargebacks?: boolean;
  rank?: string;
  categoryFilter:string;
};

export type ListAffiliatesResponse = {
  affiliates: Affiliate[];
  statistics: {
    totalAffiliates: number;
    totalSales: number;
    totalCommissions: number;
    averageSales: number;
    averageCommissions: number;
    statusDistribution: Array<{ _id: string; count: number }>;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  filtersApplied: {
    search?: string | null;
    selfAffiliateId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    status?: string | null;
    enrollmentDateRange?: { from?: string; to?: string } | null;
  };
};

export type GetAffiliatesByEnrollerPayload = {
  companyId: string;
  enrolledBy: number;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type GetAffiliatesByEnrollerResponse = {
  enroller: Enroller | null;
  affiliates: Array<{
    _id: string;
    selfAffiliateId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
    enrollmentDate: string;
    rank: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
};
