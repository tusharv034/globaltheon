import api from "@/lib/axios";
import { ApiResponse } from "@/types";

export const createCommissionPeriods = async (payload: any) => await api.post("/protected/commission/commission-periods", payload, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const readCommissionPeriods = async (payload: any) => {

    // Start with the base clean URL
    let url = "/protected/commission/commission-periods";

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

    return await api.get(url, {
        headers: {
            "Content-Type": "application/json"
        }
    })
};

export const toggleDisplay = async (payload: any) => {

    return await api.patch(`/protected/commission/commission-periods/display-bo/${payload.periodId}`, {
        display: payload.display
    }, {
        headers: {
            "Content-Type": "application/json"
        }
    })
}

export const updateCommissionPeriodsStatus = async (payload: any) => {

    return await api.patch(`/protected/commission/commission-periods/status/${payload.periodId}`, {
        status: payload.status
    }, {
        headers: {
            "Content-Type": "application/json"
        }
    });
}

export const readCommissionDetails = async (payload: any) => {

    let url = `/protected/commission/ledger/${payload.periodId}`

    // Only build query string if at least one pagination param exists
    const queryParts: string[] = [];

    if (payload.page !== undefined && payload.page !== null) {
        queryParts.push(`page=${encodeURIComponent(payload.page)}`);
    }

    if (payload.limit !== undefined && payload.limit !== null) {
        queryParts.push(`limit=${encodeURIComponent(payload.limit)}`);
    }

    if (payload?.searchTerm?.trim()) {
        queryParts.push(`searchTerm=${encodeURIComponent(payload?.searchTerm.trim())}`);
    }

    if (payload.sortBy) {
        queryParts.push(`sortBy=${encodeURIComponent(payload.sortBy)}`);
    }

    if (payload.sortOrder) {
        queryParts.push(`sortOrder=${encodeURIComponent(payload.sortOrder)}`);
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

export const calculateCommissionByPeriod = async (payload: any) => {

    const body = {};

    if(payload.periodId) {
        body.periodId = payload.periodId
    }

    if(payload.affiliateId) {
        body.affiliateId = payload.affiliateId
    }

    return await api.post(`/protected/commission/calculate-commissions`, body, {
        headers: {
            "Content-Type": "application/json"
        }
    })
}

export const createCommissionAdjustmment = async (payload: any) => await api.post(`/protected/commission/commission-adjustments/${payload.periodId}`, {
    reason: payload.reason,
    orderId: payload.orderId,
    adjustmentAmount: payload.adjustmentAmount,
    affiliateId: payload.affiliateId,
}, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const updateCommissionAdjustmment = async (payload: any) => await api.put(`/protected/commission/commission-adjustments/${payload.adjustmentId}`, payload, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const readCommissionAdjustments = async (payload: any) => {

   

    let url = `/protected/commission/commission-adjustments/collection/${payload.periodId}`

    return await api.get(url, {
        headers: {
            "Content-Type": "application/json"
        }
    })
}

export const deleteCommissionAdjustment = async (payload: any) => await api.delete(`/protected/commission/commission-adjustments/${payload.adjustmentId}`, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const readAllAdjustments = async (payload: any) => await api.post(`/protected/commission/commission-adjustments/collection/all`, payload, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const updateCommissionPeriodStatus = async (payload: any) => await api.put(`/protected/commission/commission-periods/${payload.periodId}`, payload, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const readCommissionAdjustmentsAllPopulate = async () => await api.get("/protected/commission/commission-adjustments/slug-collection/populate-all", {
    headers: {
        "Content-Type": "application/json"
    }
});

export const readCommissionDetailsInsights = async (payload: any) => await api.get(`/protected/commission/commission-details/period-insights/${payload.periodId}`, { headers: {"Content-Type": "application/json" }});

export const readAdjustmentsByPeriod = async (payload: any) => await api.get(`/protected/commission/commission-adjustments-by-period/${payload.periodId}`, { headers: {"Content-Type": "application/json" }});

export const downloadCommissionPeriod = async (payload: any) => {

    return await api.get<ApiResponse<any>>(`/protected/commission/commission-periods/download/${payload.periodId}?downloadFormat=${payload.downloadFormat}`, {headers: { "Content-Type": "application/json"}});
}

export const checkExportStatus = async (payload: any) => await api.get<ApiResponse<any>>(`/protected/commission/commission-periods/download-status/${payload.exportId}`, {headers: {"Content-Type": "application/json"}});