export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
    BAD_REQUEST = 400,
}

export const ResponseMessages = {
  ADMIN_CREATED: 'Admin created',
  ADMIN_UPDATED: 'Admin updated',
  ADMIN_NOT_FOUND: 'Admin not found',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
    INVALID_RANGE: 'Invalid range parameter',
  INVALID_PAGINATION: 'Invalid pagination parameters',
   SUBSCRIPTION_FETCH_FAILED: 'Failed to fetch subscriptions',
  SUBSCRIPTION_UPDATE_FAILED: 'Failed to update subscription',
};
