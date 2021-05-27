<template>
  <single-page-layout :title="$t('settings.settings')">
    <div class="container-sm mx-auto">
      <div v-if="successVisible" class="alert alert-success mb-6">
        {{ $t('settings.saved') }}
      </div>
      <form @submit.prevent="handleSubmit" class="mb-4">
        <form-control
          v-model.trim="timeout"
          name="node"
          :label="$t('profile.session')"
          :options="options"
          type="select"
          @blur="handleBlur('session')"
        ></form-control>

        <form-control
          v-model.trim="address"
          name="node"
          :label="$t('profile.node')"
          @blur="handleBlur('address')"
        ></form-control>
        <button type="submit" class="button-primary mb-2">
          {{ $t('common.save') }}
        </button>
      </form>
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { SettingsModule } from '~/store'
import SinglePageLayout from '../components/Layouts/SinglePageLayout.vue'
import FormControl from '../components/UI/Form/FormControl.vue'

@Component({
  components: { FormControl, SinglePageLayout },
  layout: 'page',
})
export default class Settings extends Vue {
  private dirty = {
    language: false,
    timeout: false,
    theme: false,
    address: false,
  }
  private saved = false
  private timeout = SettingsModule.timeout
  private language = SettingsModule.language
  private theme = SettingsModule.theme
  private address = SettingsModule.address

  private get successVisible(): boolean {
    if (!this.saved) {
      return false
    }
    return !(this.dirty.language || this.dirty.timeout || this.dirty.theme || this.dirty.address)
  }

  private get options(): any[] {
    return [
      { label: this.$t('settings.minutes', { min: '5' }), value: 5 },
      { label: this.$t('settings.minutes', { min: '10' }), value: 10 },
      { label: this.$t('settings.minutes', { min: '20' }), value: 20 },
      { label: this.$t('settings.minutes', { min: '40' }), value: 40 },
      { label: this.$t('settings.hours', { min: '1' }), value: 60 },
    ]
  }

  private saveSettings(settings: Record<string, any>): Promise<void> {
    return SettingsModule.saveSettings(settings)
  }

  private handleBlur(name: string): void {
    this.dirty[name] = true
  }

  private handleSubmit(): void {
    this.saveSettings({
      language: this.language,
      timeout: this.timeout,
      theme: this.theme,
      address: this.address,
    })
    this.dirty = {
      language: false,
      timeout: false,
      theme: false,
      address: false,
    }
    this.saved = true
  }
}
</script>
