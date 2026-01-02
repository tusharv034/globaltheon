import api from "@/lib/axios";
import {
    ApiResponse,
    CompensationPlanResponse,
    CompensationPlanPayload
} from "@/types";



export const getCompensationPlan = async () => await api.get<ApiResponse<CompensationPlanResponse>>("/protected/compensation-plan", {
    headers: {
        "Content-Type": "application/json",
    },
});

export const updateCompensationPlan = async (data: CompensationPlanPayload) => {
    return await api.put<ApiResponse>(
        "/protected/compensation-plan",
        data,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
}