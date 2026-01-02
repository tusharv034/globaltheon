import api from "@/lib/axios";
import { ApiResponse } from "@/types";


import { OrdersDataResponse, SingleOrderResponse } from "@/types";


export const getAllOrders = async (params: {
  orderType?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  search?: string;
  page?: number;
  limit?: number;
  statusFilter?: number;
  sortBy?: string;        // ← ADD THIS
  sortOrder?: "asc" | "desc"; // ← ADD THIS
}) => {
  const response = await api.get<ApiResponse<OrdersDataResponse>>(
    "/protected/orders/get-all-orders",
    {
      params: {
        orderType: params.orderType || "all",
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        search: params.search || undefined,
        page: params.page || 1,
        limit: params.limit || 25,
        statusFilter: params.statusFilter,
        sortBy: params.sortBy,           // ← send sort field
        sortOrder: params.sortOrder,     // ← send asc/desc
      },
    }
  );
  return response.data;
};

export const getOrderById = async (
  orderId: string,
  customerType: string
): Promise<SingleOrderResponse> => {
  const response = await api.post<ApiResponse<SingleOrderResponse>>(
    "/protected/orders/get-by-orderId",
    {
      orderId,
      customerType,
    }
  );

  return response.data.data; // adjust if your ApiResponse wraps in .data
};


export const updateOrderStatus = async (
  orderId: string,
  newStatus: number
) => {
  const response = await api.patch<ApiResponse<any>>(
    "/protected/orders/update-status",
    { orderId, newStatus }
  );
  return response.data;
};

export const deleteOrder = async (orderId: string) => {
  const response = await api.delete<ApiResponse<any>>(
    "/protected/orders/delete-order",
    {
      data: { orderId },
    }
  );
  return response.data;
};


export const getCustomerOrders = async (customerId: string | number, params: {
  page?: number;
  limit?: number;
  orderId: number | string;
  startDate?: Date | string |  null;
  endDate?: Date | string | null;
}) => {
  const response = await api.get<ApiResponse<any>>(
    `/protected/orders/customer/${customerId}/orders`,
    {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        orderId: params.orderId || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
      },
    }
  );

  return response.data;
};

export const createOrderNote = async (payload: any) => await api.post<ApiResponse<any>>(`/protected/orders/notes/${payload.orderId}`, { text: payload.text }, {
  headers: {
    "Content-Type": "application/json"
  }
})

export const readOrderNotes = async (payload: any) => await api.get<ApiResponse<any>>(`/protected/orders/notes/${payload}`, {
    headers: {
      "Content-Type": "application/json"
    }
  })

export const updateOrderNotes = async (payload: any) => await api.put<ApiResponse<any>>(`/protected/orders/notes/${payload.noteId}`, { text: payload.text }, {
  headers: {
    "Content-Type": "application/json"
  }
});

export const readOrdersByCustomerIds = async (payload: any) => await api.post<ApiResponse<any>>("/protected/orders/read-by-customers", {
  customerIds: payload.customerIds
}, {
  headers: {
    "Content-Type": "application/json"
  }
})


// Initiate export (returns exportId)
export const initiateOrderExport = async (params: {
  orderType?: string;
  startDate?: string | null;
  endDate?: string | null;
  search?: string;
  statusFilter?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<any> => {
  const response = await api.get("/protected/orders/orders/export", {
    params: {
      orderType: params.orderType || "all",
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
      search: params.search || undefined,
      statusFilter: params.statusFilter === -1 ? undefined : params.statusFilter,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });
  return response.data; // { success, data: { exportId, status, statusCheckUrl } }
};

// Check export status
export const checkExportStatus = async (exportId: string): Promise<any> => {
  const response = await api.get(`/protected/orders/orders/export/status/${exportId}`);
  return response.data;
};

export const getAffiliateOrders = async (
  affiliateId: string,
  params: {
    page?: number;
    limit?: number;
    orderId?: number | string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
  }
) => {
  const response = await api.get<ApiResponse<any>>(
    `/protected/orders/affiliate/${affiliateId}/orders`,
    {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        orderId: params.orderId || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
      },
    }
  );
  return response.data;
};


export const getCommissionsByOrder = async (orderId: string) => {
  const response = await api.get<ApiResponse<any>>(
    `/protected/orders/get-commission-order/${orderId}`
  );

  return response.data;
};


// Fetch deleted orders (Trash/Deleted view)
export const getDeletedOrders = async (params: {
  page?: number;
  limit?: number;
  searchValue?: string;
  status?: number | string;  // matches backend payload.status (orderStatus)
}): Promise<ApiResponse<any>> => {
  const response = await api.get<ApiResponse<any>>("/protected/orders/get-deleted-orders", {
    params: {
      page: params.page || 1,
      limit: params.limit || 25,
      searchValue: params.searchValue || undefined,
      status: params.status !== undefined && params.status !== "" ? params.status : undefined,
    },
  });

  return response.data;
};

export const restoreOrder = async (orderId: string) => {
  const response = await api.patch<ApiResponse<any>>(
    "/protected/orders/restore-order",
    { orderId }
  );
  return response.data;
};

export const permanentDeleteOrder = async (orderId: string) => {
  const response = await api.post<ApiResponse<any>>(
    `/protected/orders/permanent-delete/${orderId}`,
    {
      entityType: "order", // Fixed entity type
    }
  );
  return response.data;
};

export const emptyPermanentDeleteOrders = async () => {
  const response = await api.delete<ApiResponse<any>>(
    "/protected/orders/empty-permanent-delete"
  );
  return response.data;
};

