<template>
  <div @click="changeTitle">{{ title }}</div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { AuthModule } from '~/store'

@Component
export default class Index extends Vue {
  get title() {
    return AuthModule.title
  }

  changeTitle() {
    AuthModule.setTitle()
  }
}
</script>

<style scoped>

</style>
