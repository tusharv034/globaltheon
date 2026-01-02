import api from "@/lib/axios";
import {
    ApiResponse,
    ReadCompanyResponse,
    CompanySettingResponse,
    CompanySettingPayload,
    CompanySocialsResponse,
    CompanySocialsPayload,
    IntegrationsResponse,
    IntegrationsPayload
} from "@/types";

export const readCompany = async () => await api.get<ApiResponse<any>>("/protected/company/");



export const getCompanyData = async () => await api.get<ApiResponse<CompanySettingResponse>>("/protected/company/", {
    headers: {
        "Content-Type": "application/json"
    }
});

export const updateCompanyData = async (data: CompanySettingPayload) => {
    // Create a new object to hold the filtered data
    const payload = {
        companyName: data.companyName || undefined,
        ownerFirstName: data.ownerFirstName || undefined,
        ownerLastName: data.ownerLastName || undefined,
        addressLineOne: data.addressLineOne === "" ? null : data.addressLineOne || undefined, // Set to null if empty string
        addressLineTwo: data.addressLineTwo === "" ? null : data.addressLineTwo || undefined, // Set to null if empty string
        city: data.city === "" ? null : data.city || undefined, // Set to null if empty string
        stateProvince: data.stateProvince === "" ? null : data.stateProvince || undefined, // Set to null if empty string
        zipPostal: data.postalCode === "" ? null : data.postalCode || undefined, // Set to null if empty string
        companyEmail: data.companyEmail === "" ? null : data.companyEmail || undefined, // Set to null if empty string
        supportEmail: data.supportEmail === "" ? null : data.supportEmail || undefined, // Set to null if empty string
        companyPhone: data.companyPhone === "" ? null : data.companyPhone || undefined, // Set to null if empty string
        hoursOfOperation: data.hoursOfOperation === "" ? null : data.hoursOfOperation || undefined, // Set to null if empty string
    };

    // Send the request with the filtered payload
    return await api.put<ApiResponse>(
        "/protected/company", // The URL for the PUT request
        payload, // The filtered data
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
};

export const getCompanySocials = async () => await api.get<ApiResponse<CompanySocialsResponse>>("/protected/company/social-media/", {
    headers: {
        "Content-Type": "application/json"
    }
})

export const updateCompanySocials = async (data: CompanySocialsPayload) => {

    const payload = {
        facebookUrl: data.facebookUrl || '',
        xUrl: data.xUrl || '',
        instagramUrl: data.instagramUrl || '',
        youtubeUrl: data.youtubeUrl || ''
    }
    return await api.put<ApiResponse>(
        "/protected/company/social-media",
        payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
};


export const getIntegrationsData = async () => await api.get<ApiResponse<IntegrationsResponse>>("/protected/company/integrations", {
    headers: {
        "Content-Type": "application/json"
    }
})

export const updateIntegrations=async(data:IntegrationsPayload)=>{
    return await api.put("/protected/company/integrations",
        data,
        {
            headers:{
                "Content-Type":"application/json"
            }
        }
    )
}