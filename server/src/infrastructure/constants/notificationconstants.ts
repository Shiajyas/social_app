// src/constants.ts

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export const ResponseMessages = {
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
  INTERNAL_ERROR: 'Internal server error. Please try again later.',
};
