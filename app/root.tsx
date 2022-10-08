import type { LinksFunction, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'

import styles from './styles/app.css'

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Replicache + Remix Template',
  viewport: 'width=device-width,initial-scale=1',
})

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }]

export const loader = () => {
  return json<RootLoaderData>({
    ENV: {
      REPLICACHE_LICENSE: process.env.REPLICACHE_LICENSE,
      PUSHER_KEY: process.env.PUSHER_KEY,
      PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
    },
  })
}

export default function App() {
  const data = useLoaderData<typeof loader>()

  return (
    <html lang='en' className='h-full'>
      <head>
        <Meta />
        <Links />
      </head>
      <body className='h-full'>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
      </body>
    </html>
  )
}

export type RootLoaderData = {
  ENV: {
    REPLICACHE_LICENSE: string | undefined
    PUSHER_KEY: string | undefined
    PUSHER_CLUSTER: string | undefined
  }
}
