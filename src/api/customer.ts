// src/services/customerService.ts
import api from "@/lib/axios";
import { ApiResponse, Customer, UpdateCustomerPayload, UpdateCustomerResponse } from "@/types"; // adjust path if needed

interface GetCustomersParams {
  search?: string;
  status?: string;
  quickFilter?: string;
  affiliateSearch?: string;
  sortBy?:
  | "name"
  | "orders"
  | "spent"
  | "last_order"
  | "affiliate"
  | "status"
  | "subscription";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  lastOrderFrom?: string; // ISO string
  lastOrderTo?: string;
  enrolledFrom?: string;
  enrolledTo?: string;
}

interface GetCustomersResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getCustomers = async (params: GetCustomersParams = {}) => {
  const response = await api.get<GetCustomersResponse>("/protected/customer", {
    params: {
      search: params.search || undefined,
      status: params.status === "all" ? undefined : params.status,
      quickFilter: params.quickFilter === "all" ? undefined : params.quickFilter,
      affiliateSearch: params.affiliateSearch || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      page: params.page,
      limit: params.limit,
      lastOrderFrom: params.lastOrderFrom,
      lastOrderTo: params.lastOrderTo,
      enrolledFrom: params.enrolledFrom,
      enrolledTo: params.enrolledTo,
    },
  });
  return response.data;
};


// Add this to your existing customerService.ts

export const updateCustomer = async (
  customerId: string,
  payload: UpdateCustomerPayload
): Promise<UpdateCustomerResponse> => {
  const response = await api.patch<UpdateCustomerResponse>(
    `/protected/customer/${customerId}`,
    payload, {
    headers: {
      "Content-Type": "application/json"
    }
  }
  );
  return response.data;
};

export const deleteCustomer = async (customerId: string) => {
  return await api.delete(`/protected/customer/${customerId}`);
};

export const getCustomerFromIdAPI = async (customerId: string) => {
  return await api.get(`protected/customer/${customerId}`);
}

export const createPhoneNumber = async (payload: any) => {
  return await api.post<ApiResponse<any>>(`/protected/customer/phone-numbers/${payload.customerId}`, payload, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const updatePhoneNumberPrimary = async (payload: any) => await api.patch<ApiResponse<any>>(`/protected/customer/phone-numbers/status/${payload.customerId}`, payload, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const updatePhoneNumbers = async (payload: any) => await api.put<ApiResponse<any>>(`/protected/customer/phone-numbers/${payload.customerId}`, payload, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const deletePhoneNumber = async (payload: any) => await api.post<ApiResponse<any>>(`/protected/customer/delete-phone-numbers/${payload.customerId}`, { numberId: payload.numberId }, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const createCustomerNote = async (payload: any) => await api.post<ApiResponse<any>>(`/protected/customer/notes/${payload.customerId}`, { text: payload.text }, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const readCustomerNotes = async (payload: any) => {
  // console.log("payload is ", payload);
  return await api.get<ApiResponse<any>>(`/protected/customer/notes/${payload}`, {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export const updateCustomerNotes = async (payload: any) => await api.put<ApiResponse<any>>(`/protected/customer/notes/${payload.noteId}`, { text: payload.text }, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const promoteCustomerToAffiliate = async (payload: any) => await api.post<ApiResponse<any>>(`/protected/customer/promote-to-affiliate/${payload.customerId}`,
  {
    siteName: payload.siteName,
    status: payload.status,
    enrolledBy: payload.enrolledBy,
    taxId: payload.taxId
  }, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const sendTemporaryPassword = async (payload: any) => await api.put<ApiResponse<any>>(`/protected/customer/send-temporary-password/${payload.customerId}`,
  {
    domainName: payload.domainName
  }, {
  headers: {
    "Content-Type": "application/json"
  }
});


export const getDeletedCustomer = async (payload: any) => {

  // Start with the base clean URL
  let url = "/protected/customer/get-deleted-customers";

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

  // console.log("URL of get customer is ", url);

  return await api.get<ApiResponse<any>>(url, {
    headers: {
      "Content-Type": "application/json"
    }
  })
};


export const restoreCustomer = async (customerId: string) => {
  // console.log("Api payload : ", customerId);
  return await api.patch<any>(
    "/protected/customer/restore-customer",
    { customerId },
    {
      headers: {
        "Content-Type": "application/json",
      }
    }
  )
}

export const readAllCustomers = async () => await api.get<ApiResponse<any>>("/protected/customer/all", {
  headers: {
    "Content-Type": "application/json"
  }
});

export const readCustomersOrders = async (payload: any) => await api.post<ApiResponse<any>>("/protected/customer/orders", { customersIds: payload.customersIds }, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const readCustomersEnrollersOrders = async (payload: any) => await api.post<ApiResponse<any>>("/protected/customer/enroller-orders", { affiliatesIds: payload.affiliatesIds }, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const readCustomersByMergeIds = async (payload: any) => await api.post<ApiResponse<any>>("/protected/customer/merge-ids", { mergeIds: payload.mergeIds }, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const updateOrdersToNewCustomer = async (payload: any) => await api.put<ApiResponse<any>>("/protected/customer/update-customer-order", payload, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const updateCustomerEnrolledBy = async (payload: any) => await api.put<ApiResponse<any>>("/protected/customer/change-enrolled-by", payload, {
  headers: {
    "content-Type": "application/json"
  }
});

export const createCustomerMergeNote = async (payload: any) => await api.post<ApiResponse<any>>("/protected/customer/merge-note", payload, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const deleteCustomersIfInIds = async (payload: any) => await api.post<ApiResponse<any>>("/protected/customer/remove-ids", payload, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const permanentDeleteCustomer = async (payload: any) => await api.post<ApiResponse<any>>(`/protected/customer/permanent-delete/${payload.id}`, payload, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const emptyPermanentDeleteCustomer = async () => await api.delete<ApiResponse<any>>(`/protected/customer/empty-permanent-delete`, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const readCustomersEnrolledBy = async () => await api.get<ApiResponse<any>>(`/protected/customer/enrolled-by`, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const readLevelOneCustomer = async (payload: any) => {

  let url = `/protected/customer/level-one-customer-overview`

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

export const readCustomerAnalytics = async() => await api.get<ApiResponse<any>>("/protected/customer/customer-analytics", {headers: { "Content-Type": "application/json"}});

export const readDuplicateCustomers = async() => await api.get<ApiResponse<any>>("/protected/customer/duplicates", {headers: { "Content-Type": "application/json"}});