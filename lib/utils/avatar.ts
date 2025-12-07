// Default avatar for users without a custom avatar
export const DEFAULT_AVATAR = '/images/default-avatar.svg'

/**
 * Get the avatar URL to display, filtering out Gravatar URLs
 * @param avatarUrl - The avatar URL from the database
 * @returns The avatar URL to display (custom or default)
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string {
  // If no avatar, return default
  if (!avatarUrl) {
    return DEFAULT_AVATAR
  }
  
  // If it's a Gravatar URL, return default avatar instead
  if (avatarUrl.includes('gravatar.com')) {
    return DEFAULT_AVATAR
  }
  
  // Otherwise, return the custom avatar
  return avatarUrl
}

