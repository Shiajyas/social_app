import { fetchData } from '@/utils/axiosHelpers';


export const userService = {
  // Fetch user suggestions (paginated)
  getSuggestions: (page: number = 1) => {
    return fetchData(
      `/users/suggestions?page=${page}`,
      {
        method: 'GET',
      },
      'Failed to fetch suggestions',
    );
  },

  // Follow a user
  getFollowers: (userId: string) => {
    return fetchData(
      `/users/followers/${userId}`,
      {
        method: 'GET',
      },

      'Failed to follow user',
    );
  },

  getFollowing: (userId: string) => {
    return fetchData(
      `/users/following/${userId}`,
      {
        method: 'GET',
      },
      'Failed to follow user',
    );
  },

  // Unfollow a user
  unfollowUser: (userId: string) => {
    return fetchData(
      `/users/unfollow/${userId}`,
      {
        method: 'POST',
      },
      'Failed to unfollow user',
    );
  },

  // Get user profile details
  getUserProfile: (userId: string) => {
    return fetchData(
      `/users/profile/${userId}`,
      {
        method: 'GET',
      },
      'Failed to fetch user profile',
    );
  },  

  // Get unread notification count
  getNotificationCount: (userId: string) => {
    return fetchData(
      `/users/notification/unreadcount/${userId}`,
      {
        method: 'GET',
      },
      'Failed to fetch notification count',
    );
  },

  // Fetch notifications with pagination (for infinite scrolling)
  getNotifications: ({
    pageParam = 1,
    limit = 15,
    userId,
  }: {
    pageParam?: number;
    limit?: number;
    userId: string;
  }) => {
    return fetchData(
      `/users/notification?userId=${userId}&page=${pageParam}&limit=${limit}`,
      {
        method: 'GET',
      },
      'Failed to fetch notifications',
    );
  },

  // Delete a specific notification
  deleteNotification: (notificationId: string) => {
    return fetchData(
      `/users/notification/${notificationId}`,
      {
        method: 'DELETE',
      },
      'Failed to delete notification',
    );
  },

  getUserMediaPosts: (userId: string) => {
    return fetchData(
      `/users/post/${userId}`,
      {
        method: 'GET',
      },
      'faild to fetch post',
    );
  },

  updateUserProfile: (userId: string, updatedData: any) => {
    return fetchData(
      `/users/profile/${userId}`,
      {
        method: 'PUT',
        data: updatedData,
      },
      'Failed to update profile',
    );
  },

  getUserSavedPosts: (userId: string) => {
    return fetchData(
      `/users/profile/savedPost/${userId}`,
      {
        method: 'GET',
      },
      'failed to get savedPost',
    );
  },

  getSubcriptiontDetails: (userId: string) => {
    return fetchData(
      `/users/subscription/${userId}`,
      {
        method: 'GET',
        data: { userId },
      },
      'Failed to fetch payment details',
    );
  },

subscribe: async (userId: string, planId: string) => {
  const res = await fetchData(
    `/users/subscribe`,
    {
      method: 'POST',
      data: { userId, planId },
    },
    'Failed to subscribe',
  );
  return res; // should contain { clientSecret, paymentIntentId, planId }
},

confirmSubscription: (userId: string, planId: string, paymentIntentId: string) => {
  return fetchData(
    `/users/confirm-subscription`,
    {
      method: 'POST',
      data: { userId, planId, paymentIntentId }, // ✅ pass it here
    },
    'Failed to confirm subscription',
  );
},

  getSubscriptionHistory: (userId: string) => {
    return fetchData(
      `/users/subscription/history/${userId}`,
      {
        method: 'GET',
        data: { userId },
      },
      'Failed to fetch subscription history',
    );
  },

  uploadMedia: (formData: FormData) => {
    return fetchData(
      '/users/upload',
      {
        method: 'POST',
        data: formData,
      },
      'Failed to upload media',
    );
  },

  changePassword: (userId: string, oldPassword: string, newPassword: string) => {
    return fetchData(
      `/users/password/${userId}`,
      {
        method: 'PUT',
        data: { oldPassword, newPassword  },
      },
      'Failed to change password',
    );
  },

  getPaymentIntent: (paymentIntentId: string) => {
  return fetchData(
    `/users/payment-intent/${paymentIntentId}`,
    { method: "GET" },
    "Failed to fetch payment intent"
  );
},

    getPlans() {
      return fetchData(
        "/users/subscriptions/plan",
        {
          method: "GET",
        },
        "Failed to get plans"
      );
    },

    getUserSubscriptions(userId: string) {
      return fetchData(
        `/users/subscriptions/user/${userId}`,
        {
          method: "GET",
        },
        "Failed to get user subscriptions"
      );
    },

};
