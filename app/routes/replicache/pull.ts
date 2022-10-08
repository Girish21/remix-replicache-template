import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { performance } from 'perf_hooks'

import { db } from '~/utils/db.server'

export const action: ActionFunction = async ({ request }) => {
  const pull = await request.json()
  console.log(`processing pull: ${JSON.stringify(pull)}`)
  const t0 = performance.now()

  try {
    return await db.tx(async t => {
      const lastMutationID = parseInt(
        (
          await t.oneOrNone(
            'select last_mutation_id from replicache_client where id = $1',
            pull.clientID,
          )
        )?.last_mutation_id ?? '0',
      )
      const changed = await t.manyOrNone(
        'select id, count, ord from counts where version >= $1',
        pull.cookie,
      )
      const cookie =
        (await t.one('select max(version) as version from counts'))?.version ??
        0

      console.log({ lastMutationID, changed, cookie })

      const patch = []
      if (pull.cookie === null) {
        patch.push({ op: 'clear' })
      }

      patch.push(
        ...changed.map(row => ({
          op: 'put',
          key: `count/${row.id}`,
          value: { count: row.count, order: parseInt(row.ord) },
        })),
      )

      return json({ lastMutationID, patch, cookie })
    })
  } catch (e) {
    console.error(e)
    return json(null, { status: 500 })
  } finally {
    console.log(`Processed pull in ${performance.now() - t0}ms`)
  }
}
