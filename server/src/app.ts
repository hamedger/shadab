import cors from 'cors'
import express from 'express'
import { config } from './config'
import { healthRouter } from './routes/health'
import { cloverRouter } from './routes/clover'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsAllowedOrigins.includes(origin)) {
          callback(null, true)
          return
        }
        callback(new Error(`Origin ${origin} is not allowed`))
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'Clover-Signature'],
    }),
  )

  app.use((req, res, next) => {
    const isCloverWebhook =
      req.path === '/api/clover/webhook' ||
      req.originalUrl.split('?')[0] === '/api/clover/webhook'

    if (isCloverWebhook) {
      express.raw({
        type: (req) => {
          const contentType = req.headers['content-type']
          return typeof contentType === 'string' && contentType.toLowerCase().includes('json')
        },
      })(req, res, next)
      return
    }
    express.json()(req, res, next)
  })

  app.use(healthRouter)
  app.use('/api/clover', cloverRouter)

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    if (message.includes('not allowed')) {
      res.status(403).json({ error: message })
      return
    }
    res.status(500).json({ error: message })
  })

  return app
}
