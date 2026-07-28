import * as functions from 'firebase-functions/v1'
import { db, Timestamp } from '../db'
import { WELCOME_BONUS_POINTS } from '../constants/loyalty'

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const isGuest = user.providerData.length === 0
  const now = Timestamp.now()

  await db.collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      isGuest,
      addresses: [],
      defaultAddressId: '',
      loyaltyPoints: isGuest ? 0 : WELCOME_BONUS_POINTS,
      loyaltyTier: 'bronze',
      totalOrderCount: 0,
      totalSpend: 0,
      dietaryPreferences: [],
      pushToken: '',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  )
})
