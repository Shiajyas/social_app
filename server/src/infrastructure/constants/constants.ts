

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  NOT_MODIFIED = 304


}



export const ResponseMessages = {
    //admin constants
  ADMIN_CREATED: 'Admin created',
  ADMIN_UPDATED: 'Admin updated',
  ADMIN_NOT_FOUND: 'Admin not found',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
    INVALID_RANGE: 'Invalid range parameter',
  INVALID_PAGINATION: 'Invalid pagination parameters',
   SUBSCRIPTION_FETCH_FAILED: 'Failed to fetch subscriptions',
  SUBSCRIPTION_UPDATE_FAILED: 'Failed to update subscription',

  //Auth constants
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  LOGIN_SUCCESS: 'Login successful.',
  OTP_SENT: 'OTP has been sent successfully.',
    OTP_SEND_FAILED: 'Failed to send OTP.',
  REGISTER_SUCCESS: 'Registration successful. OTP sent to your email.',
  USER_NOT_FOUND: 'User not found.',
  INVALID_USER_REQUEST: 'Invalid request: User information is missing.',
  OTP_VERIFIED: 'OTP verified successfully.',
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
   RESET_PASSWORD_SUCCESS: 'Password reset successfully.',
  RESET_PASSWORD_FAILED: 'Failed to reset password.',
   USER_LIST_FETCH_FAILED: 'Failed to fetch user list.',
  GOOGLE_AUTH_FAILED: 'Google login failed.',
  GOOGLE_AUTH_SUCCESS: 'User verified successfully.',
  REFRESH_TOKEN_MISSING: 'No refresh token found.',
  REFRESH_TOKEN_FAILED: 'Failed to refresh token.',
  REFRESH_TOKEN_SUCCESS: 'Token refreshed successfully.',

  //User constants

    USER_ID_MISSING: 'User ID is missing.',
  FOLLOW_SUCCESS: 'Successfully unfollowed user',
  PROFILE_UPDATED: 'Profile updated successfully',
  SUBSCRIPTION_NOT_FOUND: 'No subscription found',
  SUBSCRIPTION_CONFIRMED: 'Subscription confirmed successfully!',
  PAYMENT_FAILED: 'Failed to create PaymentIntent',
  PAYMENT_ERROR: 'Payment error',
  SUBSCRIPTION_FAILED: 'Subscription update failed',
  FILE_UPLOAD_ERROR: 'Error uploading media',
  SEARCH_QUERY_EMPTY: 'Empty search query',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_CHANGE_FAILED: "oldPassword not match!!",
  
  USER_FETCH_SUCCESS: 'User fetched successfully',

  //notification constants

    USER_ID_REQUIRED: 'User ID is required.',
  NOTIFICATION_ID_REQUIRED: 'Notification ID is required.',
  UNREAD_COUNT_FETCH_SUCCESS: 'Unread notification count fetched successfully.',
  UNREAD_COUNT_FETCH_FAILED: 'Failed to fetch unread count.',
  MARK_AS_READ_SUCCESS: 'Notifications marked as read.',
  MARK_AS_READ_FAILED: 'Failed to mark notifications as read.',
  NOTIFICATIONS_FETCH_SUCCESS: 'Notifications fetched successfully.',
  NOTIFICATIONS_FETCH_FAILED: 'Failed to fetch notifications.',
  NOTIFICATION_DELETE_SUCCESS: 'Notification deleted successfully.',
  NOTIFICATION_DELETE_FAILED: 'Failed to delete notification.',
  
  //post constants

  UNAUTHORIZED: 'Unauthorized access.',

  // Post
  POST_CREATED: 'Post created successfully.',
  POST_UPDATED: 'Post updated successfully.',
  POST_DELETED: 'Post deleted successfully.',
  POST_LIKED: 'Post liked successfully.',
  POST_UNLIKED: 'Post unliked successfully.',
  POST_REPORTED: 'Post reported successfully.',
  POST_NOT_FOUND: 'Post not found.',
  POSTS_FETCH_SUCCESS: 'Posts fetched successfully.',
  COMMENTS_FETCH_SUCCESS: 'Comments fetched successfully.',
  NO_MEDIA: 'Please add photo(s).',
  POST_ID_REQUIRED: 'Post ID is required.',
  PHOTO_REQUIRED: 'Please add photo(s).',
  DESCRIOTION_REQUIRED: 'Please add a description.',
  INVALID_HASHTAG  :'Hashtag query parameter is required',

  SUCCESS: 'Success',

  //Group constants

  GROUP_CREATED: 'Group created successfully.',
  GROUP_UPDATED: 'Group updated successfully.',
  GROUP_DELETED: 'Group deleted successfully.',
  GROUP_NOT_FOUND: 'Group not found.',
  GROUPS_FETCH_SUCCESS: 'Groups fetched successfully.',
};
