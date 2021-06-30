<template>
  <div>
    <Nuxt />
    <portal-target name="side-modal" multiple />
    <portal-target name="modal" multiple />
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { SettingsModule } from '~/store'

@Component
export default class Page extends Vue {
  private async created (): Promise<void> {
    await SettingsModule.loadSettings()
    await SettingsModule.getDynamicGlobalProperties()
  }

  private mounted (): void {
    document.body.classList.add('block')
  }

  private destroyed (): void {
    document.body.classList.remove('block')
  }
}
</script>
