<template>
  <div></div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { Context } from '@nuxt/types'

@Component({
  middleware({ redirect, query }: Context): void {
    let scope = 'posting'
    if (query.scope === 'login') {
      scope = 'login'
    }
    if (query.scope?.includes('offline')) {
      scope = 'posting'
      query.response_type = 'code'
    }
    query.scope = scope
    redirect('/login', query)
  }
})
export default class Authorize extends Vue {
}
</script>
