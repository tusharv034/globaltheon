// src/api/affiliate.ts
import api from "@/lib/axios";
import { ApiResponse } from "@/types";
import {
  UpdateAffiliatePayload,
  UpdateAffiliateResponse,
  GetAffiliateResponse,
  ListAffiliatesPayload,
  ListAffiliatesResponse,
  GetAffiliatesByEnrollerPayload,
  GetAffiliatesByEnrollerResponse,
} from "@/types/api/affiliate";

import { GetAffiliateCustomerResponse } from "@/types"

// Helper function to get companyId from auth store or localStorage
const getCompanyId = (): string => {
  // Try to get from auth store
  if (typeof window !== "undefined") {
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.state?.user?.selfClientId) {
          return parsed.state.user.selfClientId.toString();
        }
      } catch (error) {
        console.error("Error parsing auth data:", error);
      }
    }
  }
  // Fallback or default - you may need to adjust this based on your auth setup
  return "1"; // Default companyId, adjust as needed
};

// Update affiliate
export const updateAffiliate = async (payload: UpdateAffiliatePayload) => {
  // Ensure companyId is set
  if (!payload.companyId) {
    payload.companyId = getCompanyId();
  }

  return await api.put<ApiResponse<UpdateAffiliateResponse>>(
    `/protected/affiliate/update/${payload._id}`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

// Get affiliate by ID
export const getAffiliateById = async (affiliateId: string) => {
  const companyId = getCompanyId();

  return await api.get<ApiResponse<GetAffiliateResponse>>(
    `/protected/affiliate/getAffiliate/${affiliateId}`,
    {
      params: { companyId },
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

// List affiliates with filters
export const listAffiliates = async (payload: ListAffiliatesPayload) => {
  console.log("list Affiliate Payload : ", payload);
  // Ensure companyId is set
  if (!payload.companyId) {
    payload.companyId = getCompanyId();
  }

  return await api.post<ApiResponse<ListAffiliatesResponse>>(
    "/protected/affiliate/affiliateList",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

// Get affiliates by enroller
export const getAffiliatesByEnroller = async (
  payload: GetAffiliatesByEnrollerPayload
) => {
  // Ensure companyId is set
  if (!payload.companyId) {
    payload.companyId = getCompanyId();
  }

  return await api.post<ApiResponse<GetAffiliatesByEnrollerResponse>>(
    "/protected/affiliate/by-enroller",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

export const updateKYC = async (payload: any) => await api.put<ApiResponse<any>>("/protected/affiliate/kyc", payload, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const readKYCs = async (payload: any) => {

  const params = new URLSearchParams();

  // Only add pagination if BOTH page and limit are present
  if (payload.page !== undefined && payload.limit !== undefined) {
    params.append("page", String(payload.page));
    params.append("limit", String(payload.limit));
  }

  // Only add search if it's not empty
  if (payload.searchTerm?.trim()) {
    params.append("searchTerm", payload.searchTerm.trim());
  }

  // Only add status filter if it's not "all" or empty
  if (payload.statusFilter && payload.statusFilter !== "all") {
    params.append("statusFilter", payload.statusFilter);
  }

  // Build final URL
  const url = `/protected/affiliate/kyc${params.toString() ? `?${params.toString()}` : ""}`;

  console.log("final URL is ", url);

  return await api.get<ApiResponse<any>>(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const revertToPendingKYC = async (affiliateId: string, payload: any) => await api.patch<ApiResponse<any>>(`/protected/affiliate/revert-to-pending/${affiliateId}`, payload, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const updateAffiliateStatus = async (payload: any) => await api.put<ApiResponse<any>>(`/protected/affiliate/status/${payload.affiliateId}`, payload, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const getAffiliateCustomers = async (
  affiliateId: string,
  search?: string,
  page = 1,
  limit = 5
) => {
  const payload: any = { affiliateId, page, limit };
  if (search?.trim()) {
    payload.search = search.trim();
  }

  return await api.post<GetAffiliateCustomerResponse>(
    "/protected/customer/getAffiliateCustomer",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
};

export const readActiveAffiliates = async () => await api.get<ApiResponse<any>>("/protected/affiliate/active", {
  headers: {
    "Content-Type": "application/json"
  }
});

export const createAffiliateNote = async (payload: any) => await api.post<ApiResponse<any>>(`/protected/affiliate/notes/${payload.affiliateId}`, { text: payload.text }, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const readAffiliateNotes = async (payload: any) => {
  return await api.get<ApiResponse<any>>(`/protected/affiliate/notes/${payload}`, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const updateAffiliateNotes = async (payload: any) => await api.put<ApiResponse<any>>(`/protected/affiliate/notes/${payload.noteId}`, { text: payload.text }, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const deleteAffiliate = async (affiliateId: string) => {
  return await api.delete(`/protected/affiliate/${affiliateId}`);
};


export const createAffiliatePhoneNumber = async (payload: any) => {
  return await api.post<ApiResponse<any>>(`/protected/affiliate/phone-numbers/${payload.affiliateId}`, payload, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const updateAffiliatePhoneNumberPrimary = async (payload: any) => await api.patch<ApiResponse<any>>(`/protected/affiliate/phone-numbers/status/${payload.affiliateId}`, payload, {
  headers: {
    "Content-Type": "application/json"
  }
})


export const deleteAffiliatePhoneNumber = async (payload: any) => await api.post<ApiResponse<any>>(`/protected/affiliate/delete-phone-numbers/${payload.affiliateId}`, { numberId: payload.numberId }, {
  headers: {
    "Content-Type": "application/json"
  }
})


export const updateAffiliatePhoneNumbers = async (payload: any) => await api.put<ApiResponse<any>>(`/protected/affiliate/phone-numbers/${payload.affiliateId}`, payload, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const impersonateAffiliate = async (affiliateId: string, payload: any) => await api.post<ApiResponse<any>>(`/protected/affiliate/impersonate-affiliate/${affiliateId}`, payload, {
  headers: {
    "Content-Type": "application/json"
  }
})


export const getDeletedAffiliates = async (payload: any) => {
  // Start with the base clean URL
  let url = "/protected/affiliate/get-deleted-affiliates";

  // Only build query string if at least one pagination param exists
  const queryParts: string[] = [];

  if (payload.page !== undefined && payload.page !== null) {
    queryParts.push(`page=${encodeURIComponent(payload.page)}`);
  }

  if (payload.limit !== undefined && payload.limit !== null) {
    queryParts.push(`limit=${encodeURIComponent(payload.limit)}`);
  }

  if (payload.searchValue?.trim()) {
    queryParts.push(`searchValue=${encodeURIComponent(payload.searchValue.trim())}`);
  }

  if (payload.status) {
    queryParts.push(`status=${encodeURIComponent(payload.status)}`);
  }

  // Only append query string if we have params
  if (queryParts.length > 0) {
    url += `?${queryParts.join("&")}`;
  }

  return await api.get<ApiResponse<any>>(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
};

export const sendTemporaryPassword = async (payload: any) => await api.put<ApiResponse<any>>(`/protected/affiliate/send-temporary-password/${payload.affiliateId}`,
  {
    domainName: payload.domainName
  }, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const returnToAdmin = async (payload: any) => await api.put<ApiResponse<any>>("/protected/affiliate/return-to-admin", {}, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const restoreAffiliate = async (affiliateId: string) => {

  return await api.patch<any>(
    "/protected/affiliate/restore-affiliate",
    { affiliateId },
    {
      headers: {
        "Content-Type": "application/json",
      }
    }
  )
}

export const readAllAffiliates = async () => await api.get<ApiResponse<any>>("/protected/affiliate/all", {
  headers: {
    "Content-Type": "application/json"
  }
});

export const readAffiliatesByEmails = async (payload: any) => await api.post<ApiResponse<any>>("/protected/affiliate/emails", { emails: payload.emails }, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const deleteAffiliatesIfInIds = async (payload: any) => await api.post<ApiResponse<any>>("/protected/affiliate/remove-ids", payload, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const duplicateAffiliates = async () => await api.get<ApiResponse<any>>("/protected/affiliate/duplicate-affiliates", {
  headers: {
    "Content-Type": "application/json"
  }
});

export const permanentDeleteAffiliate = async (payload: any) => await api.post<ApiResponse<any>>(`/protected/affiliate/permanent-delete/${payload.id}`, {
  entityType: payload.entityType
}, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const emptyPermanentDeleteAffiliate = async () => await api.delete<ApiResponse<any>>(`/protected/affiliate/empty-permanent-delete`, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const validateMergeAffiliate = async (payload: any) => await api.post<ApiResponse<any>>(`/protected/affiliate/validate-merge-affiliates/${payload.mergeId}`, {}, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const convertCustomerToAffiliate = async (payload: any) => await api.post(`/protected/affiliate/convert-customer-to-affiliate`, {
  customerId: payload.customerId
}, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const readAffiliatesDynamic = async (payload: any) => {
  // Start with the base clean URL
  let url = "/protected/affiliate/read-affiliates-dynamic";

  // Only build query string if at least one pagination param exists
  const queryParts: string[] = [];

  if (payload.searchValue?.trim()) {
    queryParts.push(`searchValue=${encodeURIComponent(payload.searchValue.trim())}`);
  }

  if (payload.searchBy) {
    queryParts.push(`searchBy=${encodeURIComponent(payload.searchBy)}`);
  }

  if (payload.periodId) {
    queryParts.push(`periodId=${encodeURIComponent(payload.periodId)}`);
  }

  // Only append query string if we have params
  if (queryParts.length > 0) {
    url += `?${queryParts.join("&")}`;
  }

  return await api.get(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const readAdjustmentAffiliate = async (payload: any) => await api.post("/protected/affiliate/adjustment", payload, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const readAffiliateByEnrolledBy = async (payload: any) => await api.get(`/protected/affiliate/read-affiliate-by-enrolled-by/${payload.enrolledBy}`, {
  headers: {
    "Content-Type": "application/json"
  }
});


export const readTeamOverview = async () => await api.get("/protected/affiliate/team-overview", {
  headers: {
    "Content-Type": "application/json"
  }
})

export const getAffiliateCommission = async (payload: { affiliateId: string, periodId?: string }) => {
  return await api.post("/protected/affiliate/affiliate-commission/", payload, {
    headers: { "Content-Type": "application/json" }
  });
}

export const readLevelOneAffiliate = async (payload: any) => {

  let url = `/protected/affiliate/level-one-affiliate-overview`

  // Only build query string if at least one pagination param exists
  const queryParts: string[] = [];

  if (payload.page !== undefined && payload.page !== null) {
    queryParts.push(`page=${encodeURIComponent(payload.page)}`);
  }

  if (payload.limit !== undefined && payload.limit !== null) {
    queryParts.push(`limit=${encodeURIComponent(payload.limit)}`);
  }

  if (payload.searchTerm !== undefined && payload.searchTerm !== null) {
    queryParts.push(`searchTerm=${encodeURIComponent(payload.searchTerm)}`);
  }

  if (payload.order !== undefined && payload.order !== null) {
    queryParts.push(`order=${encodeURIComponent(payload.order)}`);
  }

  if (payload.sortBy !== undefined && payload.sortBy !== null) {
    queryParts.push(`sortBy=${encodeURIComponent(payload.sortBy)}`);
  }
  if (payload.sortOrder !== undefined && payload.sortOrder !== null) {
    queryParts.push(`sortOrder=${encodeURIComponent(payload.sortOrder)}`);
  }

  // Only append query string if we have params
  if (queryParts.length > 0) {
    url += `?${queryParts.join("&")}`;
  }

  return await api.get<ApiResponse<any>>(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const readLevelTwoInsights = async (payload: any) => {

  let url = `/protected/affiliate/level-two-insights`

  // Only build query string if at least one pagination param exists
  const queryParts: string[] = [];

  if (payload.page !== undefined && payload.page !== null) {
    queryParts.push(`page=${encodeURIComponent(payload.page)}`);
  }

  if (payload.limit !== undefined && payload.limit !== null) {
    queryParts.push(`limit=${encodeURIComponent(payload.limit)}`);
  }

  if (payload.searchTerm !== undefined && payload.searchTerm !== null) {
    queryParts.push(`searchTerm=${encodeURIComponent(payload.searchTerm)}`);
  }

  if (payload.roleFilter !== undefined && payload.roleFilter !== null) {
    queryParts.push(`roleFilter=${encodeURIComponent(payload.roleFilter)}`);
  }

  if (payload.selfAffiliateId !== undefined && payload.selfAffiliateId !== null) {
    queryParts.push(`selfAffiliateId=${encodeURIComponent(payload.selfAffiliateId)}`);
  }

  if (payload.sortBy !== undefined && payload.sortBy !== null) {
    queryParts.push(`sortBy=${encodeURIComponent(payload.sortBy)}`);
  }
  if (payload.sortOrder !== undefined && payload.sortOrder !== null) {
    queryParts.push(`sortOrder=${encodeURIComponent(payload.sortOrder)}`);
  }

  // Only append query string if we have params
  if (queryParts.length > 0) {
    url += `?${queryParts.join("&")}`;
  }

  return await api.get<ApiResponse<any>>(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const readOverview = async (payload: any) => {
  let url = `/protected/affiliate/overview-analytics`

  // Only build query string if at least one pagination param exists
  const queryParts: string[] = [];

  if (payload.affiliatePeriod !== undefined && payload.affiliatePeriod !== null) {
    queryParts.push(`affiliatePeriod=${encodeURIComponent(payload.affiliatePeriod)}`);
  }

  if (payload.customerPeriod !== undefined && payload.customerPeriod !== null) {
    queryParts.push(`customerPeriod=${encodeURIComponent(payload.customerPeriod)}`);
  }

  // Only append query string if we have params
  if (queryParts.length > 0) {
    url += `?${queryParts.join("&")}`;
  }

  return await api.get<ApiResponse<any>>(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const readSalesMetrics = async (payload: any) => {
  let url = `/protected/affiliate/sales-metrics`

  // Only build query string if at least one pagination param exists
  const queryParts: string[] = [];

  if (payload.affiliatePeriod !== undefined && payload.affiliatePeriod !== null) {
    queryParts.push(`affiliatePeriod=${encodeURIComponent(payload.affiliatePeriod)}`);
  }

  if (payload.customerPeriod !== undefined && payload.customerPeriod !== null) {
    queryParts.push(`customerPeriod=${encodeURIComponent(payload.customerPeriod)}`);
  }

  // Only append query string if we have params
  if (queryParts.length > 0) {
    url += `?${queryParts.join("&")}`;
  }

  return await api.get<ApiResponse<any>>(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const readAffiliateLeaderboard = async (payload: any) => {
  let url = `/protected/affiliate/leaderboard`

  // Only build query string if at least one pagination param exists
  const queryParts: string[] = [];

  if (payload.metric !== undefined && payload.metric !== null) {
    queryParts.push(`metric=${encodeURIComponent(payload.metric)}`);
  }

  if (payload.startDate !== undefined && payload.startDate !== null) {
    queryParts.push(`startDate=${encodeURIComponent(payload.startDate)}`);
  }

  if (payload.endDate !== undefined && payload.endDate !== null) {
    queryParts.push(`endDate=${encodeURIComponent(payload.endDate)}`);
  }

  if (payload.limit !== undefined && payload.limit !== null) {
    queryParts.push(`limit=${encodeURIComponent(payload.limit)}`);
  }

  // Only append query string if we have params
  if (queryParts.length > 0) {
    url += `?${queryParts.join("&")}`;
  }

  return await api.get<ApiResponse<any>>(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const readStateDistribution = async () => await api.get<ApiResponse<any>>("/protected/customer/distribution-by-state", {
  headers: {
    "Content-Type": "application/json"
  }
});

export const readAffiliateAnalytics = async () => await api.get<ApiResponse<any>>("/protected/affiliate/affiliate-analytics", {
  headers: {
    "Content-Type": "application/json"
  }
})