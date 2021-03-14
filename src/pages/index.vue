<template>
  <component :is="component"/>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { isWeb } from '~/utils'
import Home from '~/components/Index/Home'
import Dashboard from '~/components/Index/Dashobard'
import checkForAuthorized from '~/middleware/auth'
import { Context } from '@nuxt/types'

@Component
export default class Index extends Vue {
  private get component(): any {
    if (isWeb()) {
      return Home
    }
    checkForAuthorized({
      redirect: this.$router.replace,
      store: this.$store,
      params: this.$route.params,
      route: this.$route,
    } as Context)
    return Dashboard
  }
}
</script>

<style scoped>

</style>
