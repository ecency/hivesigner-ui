<template>
  <div class="font-old">
    <Header :title="$t('settings.settings')"/>
    <div class="p-6">
      <div class="container-sm mx-auto">
        <div v-if="successVisible" class="alert alert-success mb-6">
          {{ $t('settings.saved') }}
        </div>
        <router-link to="/accounts" class="p-4 block border rounded overflow-hidden mb-6">
          <h4 class="text-xl font-bold text-black-500">{{ $t('accounts.accounts') }}</h4>
        </router-link>
        <form @submit.prevent="handleSubmit" class="mb-4">
          <!--
          <label for="language">Language</label>
          <select
            v-model="language"
            id="language"
            class="form-select input-lg input-block mb-2"
            @blur="handleBlur('language')"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
          -->
          <label for="timeout">{{ $t('settings.session') }}</label>
          <select
            v-model="timeout"
            id="timeout"
            class="block mb-2"
            @blur="handleBlur('timeout')"
          >
            <option value="5">{{ $t('settings.minutes', { min: '5' }) }}</option>
            <option value="10">{{ $t('settings.minutes', { min: '10' }) }}</option>
            <option value="20">{{ $t('settings.minutes', { min: '20' }) }}</option>
            <option value="40">{{ $t('settings.minutes', { min: '40' }) }}</option>
            <option value="60">{{ $t('settings.hours', { min: '1' }) }}</option>
          </select>
          <!--
          <label for="theme">Theme</label>
          <select
            v-model="theme"
            id="theme"
            class="form-select input-lg input-block mb-2"
            @blur="handleBlur('theme')"
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
          -->
          <label for="address">{{ $t('settings.node') }}</label>
          <input
            v-model.trim="address"
            id="address"
            name="to"
            type="text"
            class="block mb-4"
            autocorrect="off"
            autocapitalize="none"
            @blur="handleBlur('address')"
          />
          <button type="submit" class="button-primary mb-2">
            {{ $t('common.save') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { SettingsModule } from '~/store'

@Component({
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
