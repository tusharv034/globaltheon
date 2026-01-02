import api from "@/lib/axios";
import { ApiResponse } from "@/types";
import { 
    CreateAnnouncementPayload, 
    CreateAnnoucementResponse, 
    ReadAnnoucementsResponse, 
    // ReadActiveAnnouncementsResponse,
    UpdateAnnoucementPayload, 
    UpdateAnnoucementResponse, 
    DeleteAnnoucementPayload, 
    DeleteAnnoucementResponse,
    // CreateUserAnnouncementPayload,
    // CreateUserAnnouncementResponse,
    // ReadUserAnnouncements 
} from "@/types/api/announcement.ts";

export const createAnnouncement = async (payload: CreateAnnouncementPayload) => await api.post<ApiResponse<CreateAnnoucementResponse>>("/protected/announcement/", payload, {
    headers: {
        "Content-Type": "application/json",
    }
});

export const readAnnouncements = async () => await api.get<ApiResponse<any>>("/protected/announcement/collection-simple", {
    headers: {
        "Content-Type": "application/json",
    }
});

export const updateAnnouncement = async (payload: UpdateAnnoucementPayload) => await api.put<ApiResponse<UpdateAnnoucementResponse>>(`/protected/announcement/${payload._id}`, payload, {
    headers: {
        "Content-Type": "application/json",
    }
});

export const deleteAnnouncement = async (payload: any) => await api.delete<ApiResponse<DeleteAnnoucementResponse>>(`/protected/announcement/${payload._id}`, {
    headers: {
        "Content-Type": "application/json",
    }
});

export const readActiveAnnouncements = async () => await api.get<ApiResponse<any>>(`/protected/announcement/collection/active`, {
    headers: {
        "Content-Type": "application/json"
    }
});

export const createUserAnnouncement = async (payload: any) => await api.post<ApiResponse<any>>(`protected/announcement/user`, payload, {
    headers: {
        "Content-Type": "application/json"
    }
} )

export const readUserAnnouncements = async () => await api.get<ApiResponse<any>>(`/protected/announcement/user/collection`, {
    headers: {
        "Content-Type": "application/json"
    }
});