import { createRequestHandler } from '@remix-run/express'
import compression from 'compression'
import express from 'express'
import morgan from 'morgan'
import path from 'path'

const BUILD_DIR = path.join(process.cwd(), 'build')

const app = express()

app.use(compression())

app.disable('x-powered-by')

app.use(
  '/build',
  express.static('public/build', { immutable: true, maxAge: '1y' }),
)

app.use(express.static('public', { maxAge: '1h' }))

app.use(morgan('dev'))

app.all(
  '*',
  process.env.NODE_ENV === 'development'
    ? (req, res, next) => {
        purgeRequireCache()

        return createRequestHandler({
          build: require(BUILD_DIR),
          mode: process.env.NODE_ENV,
        })(req, res, next)
      }
    : createRequestHandler({
        build: require(BUILD_DIR),
        mode: process.env.NODE_ENV,
      }),
)
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`🚀 server listening on port ${port}`)
})

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, but then you'll have to reconnect to databases/etc on each
  // change. We prefer the DX of this, so we've included it for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key]
    }
  }
}
