import api from "@/lib/axios";
import { ApiResponse, LoginResponse, ResetPasswordPayload, ResetUserPasswordResponse, UpdateUserPasswordPayload, UpdateUserPasswordResponse, UpdateUserPayload, UpdateUserResponse } from "@/types";
import {
    CreateCompanyUserPayload, CreateCompanyUserResponse, ReadCompanyUsersResponse, UpdateCompanyUserPayload, UpdateCompanyUserResponse, ReadRoleMasterResponse, DeleteCompanyUserPayload, DeleteCompanyUserResponse,
    // UpdateProfilePicturePayload, UpdateProfilePictureResponse, RemoveProfilePicturePayload, RemoveProfilePictureResponse 
} from "@/types/api/auth.ts";

export const login = async (email: string, password: string) => await api.patch<ApiResponse<LoginResponse>>("/auth/login", { email, password }, {
    headers: {
        "Content-Type": "application/json",
    }
});

export const resetUserPassword = async (payload: ResetPasswordPayload) => await api.put<ApiResponse<ResetUserPasswordResponse>>("/auth/reset-password", { email: payload.email, domainName: payload.domainName }, {
    headers: {
        "Content-Type": "application/json",
    }
});

export const readUser = async () => await api.get<ApiResponse<LoginResponse>>("/protected/auth/users", {
    headers: {
        "Content-Type": "application/json"
    }
});

export const updateUser = async (payload: UpdateUserPayload) => await api.put<ApiResponse<UpdateUserResponse>>("/protected/auth/profile", payload, {
    headers: {
        "Content-Type": "application/json",
    }
});

export const updateUserPassword = async (payload: UpdateUserPasswordPayload) => await api.put<ApiResponse<UpdateUserPasswordResponse>>("/protected/auth/update-password", payload, {
    headers: {
        "Content-Type": "application/json",
    }
});

export const readAllowedRoles = async () => await api.get<ApiResponse<ReadRoleMasterResponse>>("/protected/auth/role-master", {
    headers: {
        "Content-Type": "application/json"
    }
});

export const createCompanyUser = async (payload: CreateCompanyUserPayload) => await api.post<ApiResponse<CreateCompanyUserResponse>>(`/protected/auth/company-user`, payload, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const readCompanyUsers = async () => await api.get<ApiResponse<ReadCompanyUsersResponse>>("/protected/auth/company-users", {
    headers: {
        "Content-Type": "application/json"
    }
});


export const updateCompanyUser = async (payload: UpdateCompanyUserPayload) => await api.put<ApiResponse<UpdateCompanyUserResponse>>(`/protected/auth/company-user/${payload._id}`, payload, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const deleteCompanyUser = async (payload: DeleteCompanyUserPayload) => await api.delete<ApiResponse<DeleteCompanyUserResponse>>(`/protected/auth/company-user/${payload._id}`, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const uploadProfilePicture = async (id: string, payload: any) => await api.patch<ApiResponse<any>>(`/protected/auth/profile/profile-picture`, payload, {
    headers: {
        // 'Content-Type': 'multipart/form-data',
    }
});

export const removeProfilePicture = async () => await api.patch<ApiResponse<any>>(`/protected/auth/profile/remove-profile-picture`, {}, {
    headers: {
        "Content-Type": "application/json"
    }
})

export const changeUserPassword = async (payload: any) => await api.put<ApiResponse<any>>("/auth/change-password", payload, {
    headers: {
        "Content-Type": "application/json",
    }
});

export const loginThroughToken = async (payload: any) => await api.put<ApiResponse<any>>("/protected/auth/impersonate-login", payload, {
    headers: {
        "Content-Type": "application/json",
    }
});

export const readAllAdmins = async () => await api.get<ApiResponse<any>>("/protected/auth/read-admins", {
    headers: {
        "Content-Type": "application/json"
    }
})

export const readDeletionLogs = async (payload: any) => {

    // Start with the base clean URL
    let url = "/protected/auth/read-deletion-logs";

    // Only build query string if at least one pagination param exists
    const queryParts: string[] = [];

    if (payload.page !== undefined && payload.page !== null) {
        queryParts.push(`page=${encodeURIComponent(payload.page)}`);
    }

    if (payload.limit !== undefined && payload.limit !== null) {
        queryParts.push(`limit=${encodeURIComponent(payload.limit)}`);
    }

    if (payload.selectedAdmin) {
        queryParts.push(`selectedAdmin=${encodeURIComponent(payload.selectedAdmin)}`);
    }

    if (payload.startDate) {
        queryParts.push(`startDate=${encodeURIComponent(payload.startDate)}`);
    }
    if (payload.endDate) {
        queryParts.push(`endDate=${encodeURIComponent(payload.endDate)}`);
    }

    // Only append query string if we have params
    if (queryParts.length > 0) {
        url += `?${queryParts.join("&")}`;
    }



    return await api.post<ApiResponse<any>>(url, {
        entityTypes: payload.entityTypes
    }, {
        headers: {
            "Content-Type": "application/json"
        }
    })
}

export const readAllAdminUsers = async () => await api.get("/protected/auth/admin-users", {
    headers: {
        "Content-Type": "application/json"
    }
})

export const checkResetPasswordAllowed = async (payload: any) => await api.get<ApiResponse<any>>(`/auth/check-reset-allowed?token=${payload.token}`, { headers: {"Content-Type": "application/json"}});