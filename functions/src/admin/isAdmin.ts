import * as admin from 'firebase-admin'

/** Must stay in sync with firestore.rules isAdminEmail(). */
const ADMIN_EMAILS = new Set([
  'deccanbawarchi7@gmail.com',
])

export async function isAdminUser(uid: string): Promise<boolean> {
  const user = await admin.auth().getUser(uid)
  const claims = (user.customClaims ?? {}) as Record<string, unknown>
  if (claims.admin) return true
  const email = user.email?.toLowerCase()
  return !!email && ADMIN_EMAILS.has(email)
}
