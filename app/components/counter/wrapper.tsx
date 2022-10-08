import Pusher from 'pusher-js'
import * as React from 'react'
import type { WriteTransaction } from 'replicache'
import { Replicache } from 'replicache'

import { ReplicacheContext } from '~/context/replicache'

import Counter from './counter'

export type ReplicacheContextType = Replicache<{
  addCount(
    tx: WriteTransaction,
    {
      id,
      count,
      order,
    }: {
      id: string
      count: number
      order: number
    },
  ): Promise<void>
}>

const Wrapper = () => {
  const [replicache, setReplicache] =
    React.useState<ReplicacheContextType | null>(null)

  React.useEffect(() => {
    const replicache = new Replicache({
      pushURL: '/replicache/push',
      pullURL: '/replicache/pull',
      licenseKey: (window as any).ENV.REPLICACHE_LICENSE ?? '',
      name: 'counter',
      mutators: {
        async addCount(
          tx,
          { id, count, order }: { id: string; count: number; order: number },
        ) {
          await tx.put(`count/${id}`, { count, order })
        },
      },
    })

    Pusher.logToConsole = true

    const pusher = new Pusher((window as any).ENV.PUSHER_KEY, {
      cluster: (window as any).ENV.PUSHER_CLUSTER,
    })

    const channel = pusher.subscribe('default')

    channel.bind('poke', () => {
      console.log('got poked')
      replicache.pull()
    })

    setReplicache(replicache)

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
      replicache.close()
    }
  }, [])

  return (
    <ReplicacheContext.Provider value={{ replicache }}>
      <Counter />
    </ReplicacheContext.Provider>
  )
}

export default Wrapper
