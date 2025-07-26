
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
};
