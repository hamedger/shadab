/**
 * Grant Firebase admin custom claim to a user.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   npx ts-node scripts/setAdminClaim.ts deccanbawarchi7@gmail.com
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'

const email = process.argv[2]?.replace(/\.$/, '').trim()
const projectId =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  'shadab-5c64e'

if (!email) {
  console.error('Usage: npx ts-node scripts/setAdminClaim.ts <email>')
  process.exit(1)
}

if (!getApps().length) {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (credPath) {
    const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'))
    initializeApp({ credential: cert(serviceAccount), projectId })
  } else {
    initializeApp({ projectId })
  }
}

async function main() {
  const user = await getAuth().getUserByEmail(email)
  await getAuth().setCustomUserClaims(user.uid, { admin: true })
  console.log(`Admin claim granted to ${email} (${user.uid})`)
  console.log('Sign out and sign back in for the claim to take effect.')
}

main().catch((err: { code?: string; message?: string }) => {
  if (err.code === 'auth/user-not-found') {
    console.error(`No Firebase Auth user found for "${email}".`)
    console.error('Create the user under Firebase Console → Authentication → Users.')
  } else {
    console.error(err.message ?? err)
  }
  process.exit(1)
})
