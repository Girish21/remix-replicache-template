import type { IDatabase } from 'pg-promise'
import pgInit from 'pg-promise'

if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL is not set`)
}

declare global {
  var client: IDatabase<{}> | undefined
}

let db: IDatabase<{}>

if (process.env.NODE_ENV === 'production') {
  const pgp = pgInit()
  db = pgp(process.env.DATABASE_URL)
} else {
  if (!global.client) {
    const pgp = pgInit()
    global.client = db = pgp(process.env.DATABASE_URL)
  } else {
    db = global.client
  }
}

export { db }
