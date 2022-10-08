import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { performance } from 'perf_hooks'
import type { ITask } from 'pg-promise'
import Pusher from 'pusher'

import { db } from '~/utils/db.server'

export const action: ActionFunction = async ({ request }) => {
  const push = await request.json()
  console.log(`processing: ${JSON.stringify(push)}`)

  const t0 = performance.now()

  try {
    await db.tx(async t => {
      const { version } = await t.one(`select nextval('version') as version`)
      let lastMutationID = await getLastMutationID(t, push.clientID)

      console.log(`version: ${version}\nlastMutationID: ${lastMutationID}`)

      for (const mutation of push.mutations) {
        const t1 = performance.now()

        const expectedMutationID = lastMutationID + 1

        if (mutation.id < expectedMutationID) {
          console.log(`skipping mutation ${mutation.id} - already applied`)
          continue
        }

        if (mutation.id > expectedMutationID) {
          console.log(`skipping mutation ${mutation.id} - from the future`)
          continue
        }

        console.log(`applying mutation ${JSON.stringify(mutation)}`)

        switch (mutation.name) {
          case 'addCount': {
            await setCount(
              t,
              {
                id: mutation.args.id,
                count: mutation.args.count,
                order: mutation.args.order,
              },
              version,
            )
            break
          }
          default:
            console.log(`unknown mutation: ${mutation.name}`)
        }

        lastMutationID = expectedMutationID
        console.log('Processed mutation in', performance.now() - t1)
      }

      console.log(
        `updating ${push.clientID} lastMutationID to ${lastMutationID}`,
      )
      await t.none(
        'UPDATE replicache_client SET last_mutation_id = $2 WHERE id = $1',
        [push.clientID, lastMutationID],
      )
    })

    await sendPoke()

    return json({}, { status: 200 })
  } catch (e) {
    console.error(e)
    return json({}, { status: 500 })
  } finally {
    console.log(`processing took ${performance.now() - t0}ms`)
  }
}

async function getLastMutationID(t: ITask<unknown>, clientId: string) {
  const clientRow = await t.oneOrNone(
    `select last_mutation_id from replicache_client where id = $1`,
    clientId,
  )

  if (clientRow) {
    return parseInt(clientRow.last_mutation_id)
  }

  console.log(`creating new client: ${clientId}`)
  await t.none(
    `insert into replicache_client (id, last_mutation_id) values ($1, 0)`,
    clientId,
  )

  return 0
}

async function setCount(
  t: ITask<unknown>,
  data: { id: string; count: number; order: number },
  version: number,
) {
  await t.none(
    `insert into counts (id, count, ord, version) values ($1, $2, $3, $4)`,
    [data.id, data.count, data.order, version],
  )
}

async function sendPoke() {
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  })
  const t0 = performance.now()
  await pusher.trigger('default', 'poke', {})
  console.log(`Sent poke in ${performance.now() - t0}ms`)
}
