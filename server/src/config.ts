function optional(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsAllowedOrigins: (
    process.env.CORS_ALLOWED_ORIGINS ??
    'http://localhost:8081,http://localhost:8082,http://127.0.0.1:8081,http://127.0.0.1:8082'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  clover: {
    apiBaseUrl: process.env.CLOVER_API_BASE_URL?.trim() || 'https://api.clover.com',
    tipsEnabled: process.env.CLOVER_TIPS_ENABLED === 'true',
    /** Public site origin for post-payment redirects (no trailing slash). */
    siteUrl:
      optional('CLOVER_SITE_URL') ??
      optional('CLOVER_SUCCESS_URL')?.replace(/\/checkout\/success\/?$/, '') ??
      'https://shadab.io',
    successUrl: optional('CLOVER_SUCCESS_URL'),
    failureUrl: optional('CLOVER_FAILURE_URL'),
  },
}
