import * as admin from 'firebase-admin'
import { FieldValue, GeoPoint, Timestamp } from 'firebase-admin/firestore'

if (!admin.apps.length) admin.initializeApp()

export const db = admin.firestore()
export { FieldValue, GeoPoint, Timestamp }
