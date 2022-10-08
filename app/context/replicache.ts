import * as React from 'react'

import type { ReplicacheContextType } from '~/components/counter/wrapper'

type Context = {
  replicache: ReplicacheContextType | null
}

export const ReplicacheContext = React.createContext<Context | null>(null)

export const useReplicache = () => {
  const context = React.useContext(ReplicacheContext)

  if (!context) {
    throw new Error('useReplicache must be used within a ReplicacheProvider')
  }

  return context
}
