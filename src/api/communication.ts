import api from "@/lib/axios";
import {
    ApiResponse,
    MasterEmailResponse,
    MasterEmailPayload,
    EmailTemplatesResponse,
    GetEmailTemplatesParams,
    createNewTemplatePayload,
    UpdateTemplatePayload,
    EmailTemplate,
    SendTestEmailPayload

} from "@/types";

export const getMasterEmailTemplate = async () => api.get<ApiResponse<MasterEmailResponse>>("/protected/communications/get-master-template", {
    headers: {
        "Content-Type": "application/json",
    },
});


export const updateMasterEmailTemplate = async (data: MasterEmailPayload) => {

    const payload = {
        headerHtml: data.headerHtml || '',
        footerHtml: data.footerHtml || '',
        isEnabled: data.isEnabled || false,

    }
    return await api.put<ApiResponse>(
        "/protected/communications/update-master-template",
        payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
}; export const getEmailTemplates = async (params: GetEmailTemplatesParams = {}) => {
    const { page = 1, limit = 10, search = "", category = "", isActive } = params;

    const query = new URLSearchParams();
    query.append("page", page.toString());
    query.append("limit", limit.toString());
    if (search) query.append("search", search);
    if (category) query.append("category", category);
    if (isActive !== undefined) query.append("isActive", isActive.toString());

    return api.get<EmailTemplatesResponse>(
        `/protected/communications/email-templates?${query}`
    );
};
// api/communication.ts

export const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    return api.patch(`/protected/communications/email-templates/${templateId}`, {
        isActive, // send exactly what we want
    });
};

export const duplicateEmailTemplate = async (templateId: string) => {
    return api.post(`/protected/communications/email-templates/${templateId}/duplicate`);
};

export const deleteEmailTemplate = async (templateId: string) => {
    return api.delete(`/protected/communications/email-templates/${templateId}`);
};

export const createEmailTemplate = async (data: createNewTemplatePayload) => {
    const payload = {
        templateName: data.templateName,
        templateId: data.templateId,
        description: data.description,
        category: data.category,
        subject: data.subject,
        emailContent: data.emailContent,
        isActive: data.isActive,
        includeMasterTemplate: data.includeMasterTemplate,
    };

    return api.post<ApiResponse>(
        "/protected/communications/create-template",
        payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
};


export const updateEmailTemplate = async (
    templateId: string,
    data: UpdateTemplatePayload
) => {
    const payload: Partial<UpdateTemplatePayload> = {
        ...(data.templateName !== undefined && { templateName: data.templateName }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.emailContent !== undefined && { emailContent: data.emailContent }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.includeMasterTemplate !== undefined && {
            includeMasterTemplate: data.includeMasterTemplate,
        }),
        // Note: templateId is usually not updatable, but if your backend allows it:
        ...(data.templateId !== undefined && { templateId: data.templateId }),
    };

    return api.patch<ApiResponse>(
        `/protected/communications/email-templates/${templateId}`,
        payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
};

export const getEmailTemplateById = async (templateId: string) => {
  return api.get<ApiResponse<EmailTemplate>>(
    `/protected/communications/email-templates/${templateId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};


export const sendTestEmail = async (payload: SendTestEmailPayload) => {
  return api.post<ApiResponse>(
    "/protected/communications/send-test-email",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};