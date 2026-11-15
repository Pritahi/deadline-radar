import * as Sentry from '@sentry/tanstackstart-react'

const dsn = (import.meta as any).env?.VITE_SENTRY_DSN

if (typeof window !== 'undefined' && dsn) {
  Sentry.init({
    dsn,
    dataCollection: {
      userInfo: false,
      httpBodies: [],
    },
    tracesSampleRate: 0.1,
  })
}
