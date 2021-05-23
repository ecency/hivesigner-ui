<template>
  <component :is="component"/>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import Home from '~/components/Index/Home'

@Component
export default class Index extends Vue {
  private get component(): any {
    return Home
  }
}
</script>

<style scoped>

</style>
