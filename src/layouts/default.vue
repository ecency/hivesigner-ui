<template>
  <div class="h-full">
    <Nuxt />
    <portal-target name="side-modal" multiple />
    <portal-target name="modal" multiple />
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { AuthModule, SettingsModule } from '~/store'

@Component
export default class Default extends Vue {
  private async created (): Promise<void> {
    await SettingsModule.loadSettings()
    await SettingsModule.getDynamicGlobalProperties()
    await AuthModule.loginSession()
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
