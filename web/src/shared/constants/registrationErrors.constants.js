/** API `code` values returned by POST /auth/register */
export const REGISTRATION_ERROR_CODES = {
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  REGISTRATION_FAILED: 'REGISTRATION_FAILED',
  PROFILE_SETUP_FAILED: 'PROFILE_SETUP_FAILED',
}

export const getRegistrationErrorMessage = (code, fallbackMessage = '') => {
  switch (code) {
    case REGISTRATION_ERROR_CODES.DUPLICATE_EMAIL:
      return 'This email is already registered.'
    case REGISTRATION_ERROR_CODES.PROFILE_SETUP_FAILED:
      return 'Failed to create account. Business profile could not be saved. Please try again.'
    case REGISTRATION_ERROR_CODES.REGISTRATION_FAILED:
      return 'Failed to create account. Please try again.'
    default:
      return fallbackMessage || 'Failed to create account. Please try again.'
  }
}
