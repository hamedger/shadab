import { NextFunction, Request, Response } from 'express'
import { auth } from '../lib/firebase'

export interface AuthedRequest extends Request {
  uid?: string
  userEmail?: string
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' })
    return
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' })
    return
  }

  try {
    const decoded = await auth.verifyIdToken(token)
    req.uid = decoded.uid
    req.userEmail = decoded.email
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired authorization token' })
  }
}
