<template>
  <single-page-layout :title="$t('message_verification.title')">
    <div class="container-sm mx-auto">
      <p class="text-gray mb-4">
        {{ $t('message_verification.description') }}
      </p>
      <form-control
        v-model="payload"
        type="textarea"
        name="payload"
        class="mb-4"
        :label="$t('message_verification.payload_label')"
        :placeholder="$t('message_verification.payload_placeholder')"
        :error="error"
      />
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <button
          class="button button-primary"
          :disabled="!payload || verifying"
          @click.prevent="handleVerify"
        >
          {{ verifying ? $t('message_verification.verifying') : $t('message_verification.verify_button') }}
        </button>
        <router-link
          class="button"
          :to="{ name: 'signmessage' }"
        >
          {{ $t('message_verification.go_to_sign') }}
        </router-link>
      </div>
      <div v-if="verificationState === 'valid'" class="alert alert-success mb-4">
        {{ $t('message_verification.success', { username: author }) }}
      </div>
      <div v-else-if="verificationState === 'invalid'" class="alert alert-error mb-4">
        {{ $t('message_verification.invalid_signature') }}
      </div>
      <div v-if="error && verificationState === 'idle'" class="alert alert-error mb-4">
        {{ error }}
      </div>
      <div v-if="decodedPayload" class="space-y-4">
        <div class="bg-gray-100 border border-gray-200 rounded p-4">
          <div class="mb-2 text-sm uppercase text-gray">
            {{ $t('message_verification.decoded_details') }}
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <div class="text-gray text-sm">
                {{ $t('message_verification.author') }}
              </div>
              <div class="font-semibold">
                {{ author }}
              </div>
            </div>
            <div>
              <div class="text-gray text-sm">
                {{ $t('message_verification.timestamp') }}
              </div>
              <div class="font-semibold">
                {{ formattedTimestamp }}
              </div>
            </div>
            <div>
              <div class="text-gray text-sm">
                {{ $t('message_verification.recovered_key') }}
              </div>
              <div class="font-mono break-all">
                {{ recoveredKey }}
              </div>
            </div>
            <div>
              <div class="text-gray text-sm">
                {{ $t('message_verification.matched_authority') }}
              </div>
              <div class="font-semibold capitalize">
                {{ matchedAuthority || $t('message_verification.unknown_authority') }}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white border border-gray-200 rounded p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="text-gray text-sm">
              {{ $t('message_verification.message_preview') }}
            </div>
            <button class="button button-sm" @click.prevent="copy(displayMessage)">
              {{ $t('message_verification.copy') }}
            </button>
          </div>
          <pre class="whitespace-pre-wrap break-words font-mono text-sm">{{ displayMessage }}</pre>
        </div>
        <div class="bg-gray-100 border border-gray-200 rounded p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="text-gray text-sm">
              {{ $t('message_verification.signature') }}
            </div>
            <button class="button button-sm" @click.prevent="copy(signature)">
              {{ $t('message_verification.copy') }}
            </button>
          </div>
          <div class="break-all font-mono text-sm">
            {{ signature }}
          </div>
        </div>
      </div>
      <Loader v-if="verifying" class="overlay fixed z-40" />
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { Account, Signature, cryptoUtils } from '@hiveio/dhive'
import { Component, Vue, Watch } from 'nuxt-property-decorator'
import Bugsnag from '~/plugins/bugsnag'
import SinglePageLayout from '~/components/Layouts/SinglePageLayout.vue'
import FormControl from '~/components/UI/Form/FormControl.vue'
import Loader from '~/components/UI/Loader.vue'
import { Authority } from '~/enums'
import { SignedMessagePayload } from '~/models'
import { b64uDec, client } from '~/utils'

@Component({
  components: { SinglePageLayout, FormControl, Loader }
})
export default class VerifyMessage extends Vue {
  private payload = ''
  private decodedPayload: SignedMessagePayload | null = null
  private verificationState: 'idle' | 'valid' | 'invalid' = 'idle'
  private verifying = false
  private error = ''
  private recoveredKey = ''
  private matchedAuthority: Authority | 'memo' | '' = ''

  private get author (): string {
    const authors = this.decodedPayload && this.decodedPayload.authors
    return Array.isArray(authors) && authors.length ? authors[0] : ''
  }

  private get signature (): string {
    return this.decodedPayload?.signatures?.[0] || ''
  }

  private get formattedTimestamp (): string {
    if (!this.decodedPayload?.timestamp) {
      return ''
    }
    return new Date(this.decodedPayload.timestamp * 1000).toLocaleString()
  }

  private get displayMessage (): string {
    if (!this.decodedPayload?.signed_message) {
      return ''
    }
    if (typeof this.decodedPayload.signed_message === 'string') {
      return this.decodedPayload.signed_message
    }
    return JSON.stringify(this.decodedPayload.signed_message, null, 2)
  }

  @Watch('$route.query.payload', { immediate: true })
  private async onRouteChange (payloadParam: string | string[]): Promise<void> {
    if (process.server) {
      return
    }
    const value = Array.isArray(payloadParam) ? payloadParam[0] : payloadParam
    if (value) {
      this.payload = value
      await this.handleVerify()
    }
  }

  private async handleVerify (): Promise<void> {
    this.error = ''
    this.verificationState = 'idle'
    this.decodedPayload = null
    this.recoveredKey = ''
    this.matchedAuthority = ''

    if (!this.payload.trim()) {
      this.error = this.$t('message_verification.payload_required') as string
      return
    }

    this.verifying = true
    try {
      const decoded = this.decodePayload(this.payload.trim())
      this.decodedPayload = decoded
      await this.verifySignature(decoded)
    } catch (err) {
      console.error('Failed to verify message', err)
      this.error = err.message || (this.$t('errors.something_wrong') as string)

      Bugsnag.notify(err)
    }
    this.verifying = false
  }

  private decodePayload (token: string): SignedMessagePayload {
    let decoded = ''
    try {
      decoded = b64uDec(token)
    } catch (error) {
      throw new Error(this.$t('message_verification.invalid_payload') as string)
    }

    try {
      const parsed = JSON.parse(decoded)
      if (!parsed?.signed_message || !parsed?.authors?.length || !parsed?.timestamp || !parsed?.signatures?.length) {
        throw new Error(this.$t('message_verification.invalid_payload') as string)
      }
      return parsed as SignedMessagePayload
    } catch (error) {
      throw new Error(this.$t('message_verification.invalid_payload') as string)
    }
  }

  private async verifySignature (payload: SignedMessagePayload): Promise<void> {
    const [author] = payload.authors
    const [signature] = payload.signatures || []
    const account = await this.loadAccount(author)
    const hash = cryptoUtils.sha256(JSON.stringify({
      signed_message: payload.signed_message,
      authors: payload.authors,
      timestamp: payload.timestamp
    }))
    const recovered = Signature.fromString(signature).recover(hash).toString()
    const authorityKeyMap = this.getAuthorityKeys(account)
    const matched = Object.entries(authorityKeyMap)
      .find(([, keys]) => keys.includes(recovered))

    this.recoveredKey = recovered
    this.matchedAuthority = (matched?.[0] as Authority | 'memo' | '') || ''
    this.verificationState = matched ? 'valid' : 'invalid'
  }

  private async loadAccount (username: string): Promise<Account> {
    const [account] = await client.database.getAccounts([username])
    if (!account) {
      throw new Error(this.$t('message_verification.account_not_found', { username }) as string)
    }
    return account
  }

  private getAuthorityKeys (account: Account): Record<string, string[]> {
    return {
      owner: account.owner?.key_auths?.map(auth => auth[0]) || [],
      active: account.active?.key_auths?.map(auth => auth[0]) || [],
      posting: account.posting?.key_auths?.map(auth => auth[0]) || [],
      memo: account.memo_key ? [account.memo_key] : []
    }
  }

  private async copy (value: string): Promise<void> {
    if (!value || !process.client || !navigator?.clipboard) {
      return
    }
    try {
      await navigator.clipboard.writeText(value)
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
