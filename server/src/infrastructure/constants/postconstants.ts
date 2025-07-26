export enum StatusCode {
  OK= 200,
  CREATED= 201,
  BAD_REQUEST= 400,
  UNAUTHORIZED=401,
  NOT_FOUND= 404,
  INTERNAL_SERVER_ERROR= 500,
} 


export const ResponseMessages = {
  // Auth
  LOGIN_SUCCESS: 'Logged in successfully.',
  LOGIN_FAILED: 'Login failed.',
  OTP_SENT: 'OTP sent successfully.',
  REGISTER_SUCCESS: 'Registered successfully.',
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

  SUCCESS: 'Success',

  // General
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
};
