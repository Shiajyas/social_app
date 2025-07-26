
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}


export const ResponseMessages = {
  USER_ID_MISSING: 'User ID is missing.',
  INTERNAL_ERROR: 'Internal server error',
  FOLLOW_SUCCESS: 'Successfully unfollowed user',
  PROFILE_UPDATED: 'Profile updated successfully',
  SUBSCRIPTION_NOT_FOUND: 'No subscription found',
  SUBSCRIPTION_CONFIRMED: '✅ Subscription confirmed successfully!',
  PAYMENT_FAILED: 'Failed to create PaymentIntent',
  PAYMENT_ERROR: 'Payment error',
  SUBSCRIPTION_FAILED: 'Subscription update failed',
  FILE_UPLOAD_ERROR: 'Error uploading media',
  SEARCH_QUERY_EMPTY: 'Empty search query',
};
