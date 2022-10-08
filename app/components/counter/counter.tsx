import * as nanoid from 'nanoid'
import { useSubscribe } from 'replicache-react'
import { z } from 'zod'

import { useReplicache } from '~/context/replicache'

const Count = z.object({
  count: z.number(),
  order: z.number(),
})
const Cache = z.array(z.tuple([z.string(), Count]))

const Counter = () => {
  const replicache = useReplicache()

  const count = useSubscribe(
    replicache?.replicache,
    async tx => {
      const list = await tx.scan({ prefix: 'count/' }).entries().toArray()

      const parsedList = Cache.safeParse(list)

      if (parsedList.success) {
        return parsedList.data.sort(
          ([, itemA], [, itemB]) => itemB.order - itemA.order,
        )
      }
      return []
    },
    [],
  )

  const increment = () => {
    replicache?.replicache?.mutate.addCount({
      id: nanoid.nanoid(),
      count: (count?.[0]?.[1]?.count ?? 0) + 1,
      order: (count?.[0]?.[1]?.order ?? 0) + 1,
    })
  }

  const decrement = () => {
    replicache?.replicache?.mutate.addCount({
      id: nanoid.nanoid(),
      count: count[0][1].count - 1,
      order: count[0][1].order + 1,
    })
  }

  return (
    <div className='grid h-screen place-content-center'>
      <h1 className='text-center text-2xl'>{count?.[0]?.[1]?.count ?? 0}</h1>
      <div className='flex justify-center gap-4'>
        <button onClick={increment}>+</button>
        <button onClick={decrement}>-</button>
      </div>
    </div>
  )
}

export default Counter
