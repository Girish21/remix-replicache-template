import { ClientOnly } from 'remix-utils'

import Counter from '~/components/counter'

export default function App() {
  return (
    <main className='h-full'>
      <ClientOnly>{() => <Counter />}</ClientOnly>
    </main>
  )
}
