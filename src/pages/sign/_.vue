<template>
  <div>
    <Header :title="title"/>
    <div v-if="parsed && uriIsValid" class="p-4 after-header">
      <div class="container-sm mx-auto">
        <Error v-if="!loading && failed" :error="error"/>
        <Confirmation v-if="!loading && !!transactionId" :id="transactionId"/>
        <div v-if="!failed && !transactionId">
          <Operation
            v-for="(operation, key) in parsed.tx.operations"
            :operation="operation"
            :key="key"
          />
          <div class="flash flash-warn mb-4" v-if="parsed.params.callback">
            You are going to get redirected to
            <span class="link-color">{{ parsed.params.callback | parseUrl }}</span
            >.
          </div>
          <div class="flash flash-warn mb-4" v-if="username && hasRequiredKey === false">
            This transaction requires your <b>{{ authority }}</b> key.
          </div>
          <div class="mb-4">
            <router-link
              :to="{ name: 'login', query: { redirect: this.$route.fullPath, authority } }"
              class="btn btn-large btn-blue mr-2 mb-2"
              v-if="!username || hasRequiredKey === false"
            >
              Continue
            </router-link>
            <button
              type="submit"
              class="btn btn-large btn-success mr-2 mb-2"
              :disabled="loading"
              @click="handleSubmit"
              v-else
            >
              {{ parsed.params.no_broadcast ? 'Sign' : 'Approve' }}
            </button>
            <button class="btn btn-large mb-2" @click.prevent="handleReject">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="p-4 after-header" v-else>
      <div class="container-sm mx-auto flash flash-error mb-4">
        Oops, something went wrong. The signing URL provided is invalid.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as hiveuri from 'hive-uri'
import { Component, Vue } from 'nuxt-property-decorator'
import {
  buildSearchParams,
  getAuthority, getLowestAuthorityRequired,
  getVestsToSP, isChromeExtension,
  isWeb,
  legacyToHiveUri,
  processTransaction, resolveTransaction, signComplete
} from '../../utils'
import { AuthModule, SettingsModule } from '../../store'
import { SignedTransaction } from '@hiveio/dhive'

@Component
export default class Sign extends Vue {
  private parsed = null
  private uriIsValid = true
  private loading = false
  private transactionId = ''
  private failed = false
  private error = false
  private hasRequiredKey = null
  private authority = getAuthority(this.$route.query.authority)

  private get isWeb(): boolean {
    return isWeb()
  }

  private get uri(): string {
    return `hive://sign/${this.$route.params.pathMatch}${buildSearchParams(this.$route)}`
  }

  private get requestId(): string {
    return this.$route.query.requestId as string
  }

  private get title(): string {
    let title = 'Confirm transaction'
    if (this.authority) title += ` (${this.authority})`
    return title
  }

  private get username(): string {
    return AuthModule.username
  }

  private get config(): any {
    return {
      vestsToSP: getVestsToSP(SettingsModule.properties),
    }
  }

  private mounted(): void {
    this.parseUri(this.uri)
    if (!this.authority && this.parsed && this.parsed.tx) {
      this.authority = getLowestAuthorityRequired(this.parsed.tx)
      this.hasRequiredKey = !!(
        AuthModule.username && AuthModule.keys[this.authority]
      )
    }
  }

  private sign(payload: any): Promise<SignedTransaction> {
    return AuthModule.sign(payload)
  }

  private broadcast(tx: any): Promise<void> {
    return AuthModule.broadcast(tx)
  }

  private parseUri(uri): void {
    let parsed
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

  private async handleSubmit(): Promise<void> {
    this.loading = true
    let sig = null
    let tx = null
    let signedTx = null
    let confirmation = null
    try {
      tx = await resolveTransaction(this.parsed, this.$store.state.auth.username)
      signedTx = await this._({ tx, authority: this.authority });
      [sig] = signedTx.signatures
    } catch (err) {
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
        confirmation = await this.broadcast(signedTx)
        this.transactionId = confirmation.id
        this.failed = false
        if (this.requestId) {
          signComplete(this.requestId, null, { result: confirmation })
        }
      } catch (err) {
        this.error = err
        console.error('Failed to broadcast transaction', err)
        this.transactionId = ''
        this.failed = true
        if (this.requestId) {
          signComplete(this.requestId, err, null)
        }
      }
    }
    // Use redirect uri
    if (
      confirmation &&
      (this.$route.query.redirect_uri || this.parsed.params.callback) &&
      isWeb()
    ) {
      const cburl =
        this.parsed.params.callback || `${this.$route.query.redirect_uri}?id=${confirmation.id}`
      // @ts-ignore
      window.location = hiveuri.resolveCallback(cburl, {
        sig,
        id: confirmation.id || undefined,
        block: confirmation.block_num || undefined,
        txn: confirmation.txn_num || undefined,
      })
    } else {
      this.loading = false
    }
  }

  private handleReject(): void {
    if (this.requestId) {
      signComplete(this.requestId, 'Request rejected', null)
    }
    if (!isChromeExtension()) {
      this.failed = false
      this.loading = false
      this.transactionId = ''
      this.$router.push('/')
    }
  }
}
</script>
