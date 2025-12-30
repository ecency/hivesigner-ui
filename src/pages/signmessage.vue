<template>
  <single-page-layout :title="$t('message_signing.title')">
    <div class="container-sm mx-auto">
      <p class="text-gray mb-4">
        {{ $t('message_signing.description') }}
      </p>
      <div v-if="!isLoggedIn" class="alert alert-warning mb-4">
        {{ $t('message_signing.login_prompt') }}
      </div>
      <form-control
        v-model="message"
        type="textarea"
        name="message"
        class="mb-4"
        :label="$t('message_signing.message_label')"
        :placeholder="$t('message_signing.message_placeholder')"
        :error="error"
      />
      <form-control
        v-if="authorityOptions.length"
        v-model="selectedAuthority"
        type="select"
        name="authority"
        class="mb-4"
        :label="$t('message_signing.authority_label')"
        :options="authorityOptions"
      >
        <template #option="{ option }">
          <span class="capitalize">{{ option.label }}</span>
        </template>
      </form-control>
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <button
          class="button button-primary"
          :disabled="!canSign || signing"
          @click.prevent="handleSign"
        >
          {{ signing ? $t('message_signing.signing') : $t('message_signing.sign_button') }}
        </button>
        <router-link
          class="button"
          :to="{ name: 'verifymessage' }"
        >
          {{ $t('message_signing.go_to_verify') }}
        </router-link>
      </div>
      <div v-if="copySuccess" class="text-success mb-4">
        {{ copySuccess }}
      </div>
      <div v-if="signedPayload && signature" class="space-y-4">
        <div class="alert alert-success" v-html="$t('message_signing.signed_notice')" />
        <div class="bg-gray-100 border border-gray-200 rounded p-4">
          <div class="mb-2 text-sm uppercase text-gray">
            {{ $t('message_signing.summary') }}
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <div>
              <div class="text-gray text-sm">
                {{ $t('message_signing.author') }}
              </div>
              <div class="font-semibold">
                {{ signedPayload.authors[0] }}
              </div>
            </div>
            <div>
              <div class="text-gray text-sm">
                {{ $t('message_signing.authority_used') }}
              </div>
              <div class="font-semibold capitalize">
                {{ selectedAuthority || signedPayload.authority }}
              </div>
            </div>
            <div>
              <div class="text-gray text-sm">
                {{ $t('message_signing.timestamp') }}
              </div>
              <div class="font-semibold">
                {{ formattedTimestamp }}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-100 border border-gray-200 rounded p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="text-gray text-sm">
              {{ $t('message_signing.signature') }}
            </div>
            <button class="button button-sm" @click.prevent="copy(signature)">
              {{ $t('message_signing.copy') }}
            </button>
          </div>
          <div class="break-all font-mono text-sm">
            {{ signature }}
          </div>
        </div>
        <div v-if="encodedPayload" class="bg-gray-100 border border-gray-200 rounded p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="text-gray text-sm">
              {{ $t('message_signing.verification_token') }}
            </div>
            <button class="button button-sm" @click.prevent="copy(encodedPayload)">
              {{ $t('message_signing.copy') }}
            </button>
          </div>
          <div class="break-all font-mono text-sm">
            {{ encodedPayload }}
          </div>
        </div>
        <div v-if="verificationLink" class="bg-gray-100 border border-gray-200 rounded p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="text-gray text-sm">
              {{ $t('message_signing.verification_link') }}
            </div>
            <button class="button button-sm" @click.prevent="copy(verificationLink)">
              {{ $t('message_signing.copy') }}
            </button>
          </div>
          <div class="break-all font-mono text-sm">
            {{ verificationLink }}
          </div>
        </div>
        <div class="bg-white border border-gray-200 rounded p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="text-gray text-sm">
              {{ $t('message_signing.message_preview') }}
            </div>
            <button class="button button-sm" @click.prevent="copy(displayMessage)">
              {{ $t('message_signing.copy') }}
            </button>
          </div>
          <pre class="whitespace-pre-wrap break-words font-mono text-sm">{{ displayMessage }}</pre>
        </div>
      </div>
      <Loader v-if="signing" class="overlay fixed z-40" />
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'nuxt-property-decorator'
import Bugsnag from '~/plugins/bugsnag'
import SinglePageLayout from '~/components/Layouts/SinglePageLayout.vue'
import FormControl from '~/components/UI/Form/FormControl.vue'
import Loader from '~/components/UI/Loader.vue'
import { Authority } from '~/enums'
import { SignedMessagePayload } from '~/models'
import { AuthModule } from '~/store'
import { b64uEnc } from '~/utils'

@Component({
  components: { SinglePageLayout, FormControl, Loader }
})
export default class SignMessage extends Vue {
  private message = ''
  private selectedAuthority: Authority | '' = ''
  private signing = false
  private error = ''
  private signedPayload: SignedMessagePayload | null = null
  private verificationLink = ''
  private encodedPayload = ''
  private copySuccess = ''
  private origin = ''

  private get isLoggedIn (): boolean {
    return !!AuthModule.username
  }

  private get authorities (): Authority[] {
    const keys = AuthModule.keys
    return Object.values(Authority).filter(authority => !!keys[authority])
  }

  private get authorityOptions (): { label: string, value: string }[] {
    return this.authorities.map(authority => ({
      label: authority,
      value: authority
    }))
  }

  private get canSign (): boolean {
    return this.isLoggedIn &&
      !!this.message.trim() &&
      !!this.selectedAuthority &&
      this.authorities.includes(this.selectedAuthority as Authority)
  }

  private get signature (): string {
    return this.signedPayload?.signatures?.[0] || ''
  }

  private get formattedTimestamp (): string {
    if (!this.signedPayload?.timestamp) {
      return ''
    }
    return new Date(this.signedPayload.timestamp * 1000).toLocaleString()
  }

  private get displayMessage (): string {
    if (!this.signedPayload?.signed_message) {
      return ''
    }
    if (typeof this.signedPayload.signed_message === 'string') {
      return this.signedPayload.signed_message
    }
    return JSON.stringify(this.signedPayload.signed_message, null, 2)
  }

  @Watch('authorities', { immediate: true })
  private setDefaultAuthority (authorities: Authority[]): void {
    if (!this.selectedAuthority && authorities.length) {
      [this.selectedAuthority] = authorities
    }
  }

  private mounted (): void {
    if (process.client) {
      this.origin = window.location.origin
    }
  }

  private async handleSign (): Promise<void> {
    this.error = ''
    this.signedPayload = null
    this.encodedPayload = ''
    this.verificationLink = ''
    this.copySuccess = ''

    if (!this.canSign) {
      this.error = this.$t('message_signing.unable_to_sign') as string
      return
    }

    this.signing = true
    try {
      const payload = await AuthModule.signMessage({
        message: { message: this.message.trim() },
        authority: this.selectedAuthority as string
      })
      this.signedPayload = payload
      this.encodedPayload = b64uEnc(JSON.stringify(payload))
      this.verificationLink = this.origin && this.encodedPayload
        ? `${this.origin}/verifymessage?payload=${this.encodedPayload}`
        : ''
    } catch (err) {
      console.error('Failed to sign message', err)
      this.error = err.message || (this.$t('errors.something_wrong') as string)

      Bugsnag.notify(err)
    }
    this.signing = false
  }

  private async copy (value: string): Promise<void> {
    if (!value || !process.client || !navigator?.clipboard) {
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      this.copySuccess = this.$t('message_signing.copied') as string
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }
}
</script>

<style scoped>
.button-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}
</style>
