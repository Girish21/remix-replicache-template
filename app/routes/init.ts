import { json } from '@remix-run/node'

import { db } from '~/utils/db.server'

export const action = async () => {
  await db.task(async t => {
    await t.none('drop table if exists counts')
    await t.none('drop table if exists replicache_client')
    await t.none('drop sequence if exists version')
    await t.none(
      'create table counts (id text primary key not null, count int not null, ord bigint not null, version bigint not null)',
    )
    await t.none(
      'create table replicache_client (id text primary key not null, last_mutation_id bigint not null)',
    )
    await t.none('create sequence version')
  })

  return json({})
}
