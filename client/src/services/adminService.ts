// services/adminOverviewService.ts

import { fetchData } from "@/utils/axiosHelpers";

export const adminOverviewService = {
  getOverviewBase: (range: string) =>
    fetchData(
      `/admin/overview?range=${range}`,
      { method: "GET" },
      "Failed to fetch base admin overview"
    ),

  getMostLikedPosts: (range: string, likeRange: { min: number; max: number }) =>
    fetchData(
      `/admin/overview/most-liked?range=${range}&minLikes=${likeRange.min}&maxLikes=${likeRange.max}`,
      { method: "GET" },
      "Failed to fetch most liked posts"
    ),

  createAdmin: (adminData: {
    email: string;
    password: string;
    roleName: string;
    username: string;
    permissions: Record<string, boolean>;
  }) =>
    fetchData(
      `/admin/create-admin`,
      { method: "POST", data: adminData },
      "Failed to create admin"
    ),

  deleteAdmin: (adminId: string) =>
    fetchData(
      `/admin/delete-admin/${adminId}`,
      { method: "DELETE" },
      "Failed to delete admin"
    ),

  updateAdmin: (adminId: string, adminData: {
    email: string;
    password: string;
    roleName: string;
    permissions: Record<string, boolean>;
  }) =>
    fetchData(
      `/admin/update-admin/${adminId}`,
      { method: "PATCH", data: adminData },
      "Failed to update admin"
    ),

    getAllAdmins: () =>
    fetchData(
      `/admin/get-admins`,
      { method: "GET" },
      "Failed to fetch admins"
    ),
};
