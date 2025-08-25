
import { fetchData } from "@/utils/axiosHelpers";
import { create } from "domain";
import { get } from "http";

export const adminSubscriptionService = {
  getSubscriptions: (params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }) =>
    fetchData(
      "/admin/subscriptions",
      {
        method: "GET",
        params,
      },
      "Failed to fetch subscriptions"
    ),

  getAllSubscriptions: (params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    fetchData(
      "/admin/subscriptions/all",
      {
        method: "GET",
        params,
      },
      "Failed to fetch all subscriptions"
    ),

 togglePlanStatus: (id: string, isSubscribed: boolean) =>
    fetchData(
      `/admin/subscriptions/${id}/toggle`,
      {
        method: "PATCH",
        data: { isSubscribed },
      },
      "Failed to toggle subscription status"
    ),

    createPlan(plan: any) {
      return fetchData(
        "/admin/subscriptions/plan",
        {
          method: "POST",
          data: plan,
        },
        "Failed to create plan"
      );
    },
    updatePlan(planId: string, plan: any) {
      return fetchData(
        `/admin/subscriptions/plan/${planId}`,
        {
          method: "PATCH",
          data: plan,
        },
        "Failed to update plan"
      );
    },

    createOrUpdatePlan(plan: any) {
      return fetchData(
        "/admin/subscriptions/plan",
        {
          method: "POST",
          data: plan,
        },
        "Failed to create or update plan"
      );
    },
    
    getPlans() {
      return fetchData(
        "/admin/subscriptions/plan",
        {
          method: "GET",
        },
        "Failed to get plans"
      );
    },

    getUserSubscriptions(userId: string) {
      return fetchData(
        `/admin/subscriptions/user/${userId}`,
        {
          method: "GET",
        },
        "Failed to get user subscriptions"
      );
    },
};
