import { defineSecret, defineString } from 'firebase-functions/params'

export const resendApiKey = defineSecret('RESEND_API_KEY')
export const resendFromEmail = defineString('RESEND_FROM_EMAIL', {
  default: 'orders@shadab.com',
})
export const ordersNotificationEmail = defineString('ORDERS_NOTIFICATION_EMAIL', {
  default: 'mjalaluddin63@gmail.com',
})

export interface ResendMailConfig {
  apiKey: string
  fromEmail: string
  toEmail: string
}

export function getResendMailConfig(): ResendMailConfig {
  const apiKey = resendApiKey.value().trim()
  const fromEmail = resendFromEmail.value().trim() || 'orders@shadab.com'
  const toEmail = ordersNotificationEmail.value().trim() || 'mjalaluddin63@gmail.com'
  return { apiKey, fromEmail, toEmail }
}
