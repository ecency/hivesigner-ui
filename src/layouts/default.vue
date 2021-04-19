<template>
  <Nuxt />
</template>
<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { SettingsModule } from '~/store'

@Component
export default class Default extends Vue {
  private async created(): Promise<void> {
    await SettingsModule.loadSettings()
    await SettingsModule.getDynamicGlobalProperties()
  }
}
</script>
<style lang="scss">
body {
  display: flex;
  align-items: center;
  justify-content: center;

  > * {
    margin: auto;
  }
}
</style>
