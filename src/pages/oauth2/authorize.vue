<template>
  <div />
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class Authorize extends Vue {
  public mounted (): void {
    const query: any = {
      ...this.$route.query
    }
    let scope = 'posting'
    if (this.$route.query.scope === 'login') {
      scope = 'login'
    }
    if (this.$route.query.scope?.includes('offline')) {
      scope = 'posting'
      query.response_type = 'code'
    }
    query.scope = scope
    this.$router.push({
      path: '/login',
      query
    })
  }
}
</script>
