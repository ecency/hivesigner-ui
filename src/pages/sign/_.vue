<template>
  <single-page-layout :title="title" :flat="!loading && (failed || !!transactionId)">
    <div v-if="parsed && uriIsValid" class="sm:p-6">
      <transaction-status
        v-if="!loading && (failed || !!transactionId)"
        :status="failed ? 'failure' : 'success'"
        :success-message="successMessage"
        :failure-message="failureMessage"
      />
      <div v-if="!failed && !transactionId" class="container-sm mx-auto">
        <Operation
          v-for="(operation, key) in parsed.tx.operations"
          :key="key"
          :operation="operation"
        />
        <div v-if="parsed.params.callback" class="alert alert-warning mb-6">
          {{ $t('sign.going_redirect_to') }}
          <span class="text-black">
            {{ parsed.params.callback | parseUrl }}
          </span>.
        </div>
        <div
          v-if="username && hasRequiredKey === false"
          class="alert alert-warning mb-6"
          v-html="$t('authorize.requires_active_key')"
        />
        <div class="mb-6">
          <router-link
            v-if="!username || hasRequiredKey === false"
            :to="{ name: 'login', query: { redirect: $route.fullPath, authority } }"
            class="button button-primary mr-2 mb-2 inline-block"
          >
            {{ $t('common.continue') }}
          </router-link>
          <button
            v-else
            type="submit"
            class="button-success mr-2 mb-2"
            :disabled="loading"
            @click="handleSubmit"
          >
            {{ $t(parsed.params.no_broadcast ? 'sign.sign' : 'sign.approve') }}
          </button>
          <button class="mb-2" @click.prevent="handleReject">
            {{ $t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="sm:p-6">
      <div class="container-sm mx-auto alert alert-error mb-6">
        {{ $t('errors.unknown') }}
      </div>
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import * as hiveuri from 'hive-uri'
import { Component, Vue } from 'nuxt-property-decorator'
import { DecodeResult } from 'hive-uri'
import TransactionStatus from '../../components/TransactionStatus.vue'
import {
  buildSearchParams,
  getAuthority,
  getLowestAuthorityRequired,
  getVestsToSP,
  legacyToHiveUri,
  processTransaction,
  resolveTransaction
} from '~/utils'
import { AuthModule, SettingsModule } from '~/store'
import { Authority } from '~/enums'
import SinglePageLayout from '~/components/Layouts/SinglePageLayout.vue'

@Component({
  components: { TransactionStatus, SinglePageLayout }
})
export default class Sign extends Vue {
  private parsed: DecodeResult | null = null
  private uriIsValid = true
  private loading = false
  private transactionId = ''
  private failed = false
  private error = ''
  private hasRequiredKey = null
  private authority = getAuthority(this.$route.query.authority as Authority)

  private get uri (): string {
    return `hive://sign/${this.$route.params.pathMatch}${buildSearchParams(this.$route)}`
  }

  private get requestId (): string {
    return this.$route.query.requestId as string
  }

  private get title () {
    let title = this.$t('sign.confirm_transaction')
    if (this.authority) {
      title += ` (${this.authority})`
    }
    return title
  }

  private get username (): string {
    return AuthModule.username
  }

  private get config (): any {
    return {
      vestsToSP: getVestsToSP(SettingsModule.properties)
    }
  }

  private get successMessage (): string {
    return `<span class="text-gray">${this.$t('sign.transaction_id')}:</span> <a href="https://hiveblocks.com/tx/${this.transactionId}" target="_blank" class="text-black hover:underline cursor-pointer">${this.transactionId}</a>`
  }

  private get failureMessage (): string {
    return `<span class="text-gray">${this.$t('sign.error_message')}:</span> ${this.error}`
  }

  private mounted (): void {
    this.parseUri(this.uri)
    if (!this.authority && this.parsed && this.parsed.tx) {
      this.authority = getLowestAuthorityRequired(this.parsed.tx)
      this.hasRequiredKey = !!(
        AuthModule.username && AuthModule.keys[this.authority]
      )
    }
  }

  private parseUri (uri): void {
    let parsed: DecodeResult
    try {
      parsed = hiveuri.decode(uri)
    } catch (err) {
      parsed = legacyToHiveUri(uri)
      if (!parsed) {
        this.uriIsValid = false
      }
    }
    this.parsed = processTransaction(parsed, this.config)
  }

  private async handleSubmit (): Promise<void> {
    this.loading = true
    let sig = null
    let tx = null
    let signedTx = null
    let confirmation = null
    try {
      tx = await resolveTransaction(this.parsed, this.username)
      signedTx = await AuthModule.sign({ tx, authority: this.authority });
      [sig] = signedTx.signatures
    } catch (err) {
      this.error = err.message
      console.error('Failed to resolve and sign transaction', err)
    }
    if (!sig) {
      this.transactionId = ''
      this.failed = true
      this.loading = false
      return
    }
    if (!this.parsed.params.no_broadcast) {
      try {
        confirmation = await AuthModule.broadcast(signedTx)
        this.transactionId = confirmation.id
        this.failed = false
      } catch (err) {
        this.error = err
        console.error('Failed to broadcast transaction', err)
        this.transactionId = ''
        this.failed = true
      }
    }
    // Use redirect uri
    if (confirmation && (this.$route.query.redirect_uri || this.parsed.params.callback)) {
      const cburl =
        this.parsed.params.callback || `${this.$route.query.redirect_uri}?id=${confirmation.id}`
      // @ts-ignore
      window.location = hiveuri.resolveCallback(cburl, {
        sig,
        id: confirmation.id || undefined,
        block: confirmation.block_num || undefined,
        txn: confirmation.txn_num || undefined
      })
    } else {
      this.loading = false
    }
  }

  private handleReject (): void {
    this.failed = false
    this.loading = false
    this.transactionId = ''
    this.$router.push('/')
  }
}
</script>
