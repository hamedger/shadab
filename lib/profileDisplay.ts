/** First letter for avatar — handles empty displayName/email (common after partial registration). */
export function getProfileInitial(displayName?: string | null, email?: string | null): string {
  const fromName = displayName?.trim()
  if (fromName) return fromName.charAt(0).toUpperCase()

  const fromEmail = email?.trim()
  if (fromEmail) return fromEmail.charAt(0).toUpperCase()

  return 'U'
}

export function getProfileDisplayName(
  displayName?: string | null,
  email?: string | null,
  fallback = 'Guest',
): string {
  const fromName = displayName?.trim()
  if (fromName) return fromName

  const fromEmail = email?.trim()
  if (fromEmail) return fromEmail.split('@')[0] || fallback

  return fallback
}
