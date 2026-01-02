import api from "@/lib/axios";
import {
  ApiResponse
} from "@/types";

export const getPerformanceOverview = async (timePeriod: string) => {
  // This function makes an API request to the performance overview endpoint with a time period query parameter.
  return await api.get<ApiResponse<any>>(`/protected/dashboard/performance-overview?timePeriod=${timePeriod}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getTeamStats = async () => {
  return await api.get<ApiResponse<any>>("/protected/dashboard/team-stats", {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getLeaderboards = async (timePeriod: string = "this-month") => {
  return await api.get<ApiResponse<any>>(
    `/protected/dashboard/leaderboards?timePeriod=${timePeriod}`
  );
};

// Revenue Metrics (MRR, ARR, trends) - no time period needed (always current + last 12 months)
export const getRevenueMetrics = async () => {
  return await api.get<ApiResponse<any>>("/protected/dashboard/revenue-metrics", {
    headers: {
      "Content-Type": "application/json",
    },
  });
};