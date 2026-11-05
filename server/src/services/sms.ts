import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../lib/firebase'

/**
 * Reservation confirmation texts via Twilio (BookAPT's account). Configured on Render with
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER (E.164, e.g. +18777423222).
 * Without them, texting is skipped — payments are never affected.
 */
function twilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  const from = process.env.TWILIO_FROM_NUMBER?.trim()
  return sid && token && from ? { sid, token, from } : null
}

/** US numbers to E.164 (+1XXXXXXXXXX); null when it can't be a valid US number. */
export function toUsE164(raw: string): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

async function sendSms(to: string, body: string): Promise<string> {
  const cfg = twilioConfig()
  if (!cfg) throw new Error('Twilio is not configured')
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${cfg.sid}:${cfg.token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: cfg.from, Body: body }).toString(),
  })
  const payload = (await response.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number }
  if (!response.ok || !payload.sid) {
    throw new Error(`Twilio ${response.status}${payload.code ? ` (${payload.code})` : ''}: ${payload.message ?? 'send failed'}`)
  }
  return payload.sid
}

const MEAL_LABELS: Record<string, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

/** "Fri Nov 6" — no commas, to keep the text inside one 160-character SMS segment. */
function formatDate(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number)
  if (!y || !m || !d) return dateString
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })
    .format(new Date(Date.UTC(y, m - 1, d)))
    .replace(/,/g, '')
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

/**
 * One-segment confirmation text (≤160 GSM-7 characters for normal bookings; plain ASCII only,
 * since one non-GSM character such as an em dash would halve the segment limit to 70).
 */
export function buildReservationConfirmedSms(r: Record<string, unknown>): string {
  const meal = MEAL_LABELS[String(r.meal ?? '')] ?? 'Buffet'
  const paid = Number(r.feeCents ?? 0)
  const balance = Number(r.balanceDueCents ?? 0)
  const payment =
    paid > 0 ? (balance > 0 ? ` Deposit ${money(paid)} paid; ${money(balance)} due on arrival.` : ` Paid ${money(paid)}.`) : ''
  return (
    `Shadab: Confirmed! ${meal} ${formatDate(String(r.date ?? ''))}, ${String(r.time ?? '')} for ${Number(r.partySize ?? 1)}.` +
    payment +
    ' Cancel 48h+ for refund: 877-742-3222. STOP to opt out'
  )
}

/** Texts the guest once per confirmed reservation. Never throws. */
export async function textReservationConfirmed(reservationId: string): Promise<void> {
  if (!twilioConfig()) {
    console.warn('[sms] Twilio not configured — skipping reservation text', { reservationId })
    return
  }
  const ref = db.collection('reservations').doc(reservationId)
  try {
    const claimed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data()
      if (!data || data.status !== 'confirmed' || data.customerSmsSent === true) return null
      if (!toUsE164(String(data.phone ?? ''))) return null
      tx.update(ref, { customerSmsSent: true, updatedAt: FieldValue.serverTimestamp() })
      return data
    })
    if (!claimed) {
      console.log('[sms] Not sent (already sent, not confirmed, or no valid US phone)', { reservationId })
      return
    }

    try {
      const sid = await sendSms(toUsE164(String(claimed.phone))!, buildReservationConfirmedSms(claimed))
      await ref.update({ customerSmsSid: sid })
      console.log('[sms] Reservation text sent', { reservationId, twilioSid: sid })
    } catch (error) {
      console.error('[sms] Reservation text failed', {
        reservationId,
        error: error instanceof Error ? error.message : String(error),
      })
      await ref.update({ customerSmsSent: false, updatedAt: FieldValue.serverTimestamp() })
    }
  } catch (error) {
    console.error('[sms] Could not claim reservation text', { reservationId, error })
  }
}
