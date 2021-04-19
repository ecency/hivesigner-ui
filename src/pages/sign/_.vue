<template>
  <div class="font-old">
    <Header :title="title"/>
    <div v-if="parsed && uriIsValid" class="p-6">
      <div class="container-sm mx-auto">
        <Error v-if="!loading && failed" :error="error"/>
        <Confirmation v-if="!loading && !!transactionId" :id="transactionId" />
        <div v-if="!failed && !transactionId">
          <Operation
            v-for="(operation, key) in parsed.tx.operations"
            :operation="operation"
            :key="key"
          />
          <div class="alert alert-warning mb-6" v-if="parsed.params.callback">
            {{ $t('sign.going_redirect_to') }}
            <span class="text-black">
              {{ parsed.params.callback | parseUrl }}
            </span>.
          </div>
          <div
            class="alert alert-warning mb-6"
            v-if="username && hasRequiredKey === false"
            v-html="$t('authorize.requires_active_key')"
          ></div>
          <div class="mb-6">
            <router-link
              :to="{ name: 'login', query: { redirect: this.$route.fullPath, authority } }"
              class="button button-primary mr-2 mb-2 inline-block"
              v-if="!username || hasRequiredKey === false"
            >
              {{ $t('common.continue') }}
            </router-link>
            <button
              type="submit"
              class="button-success mr-2 mb-2"
              :disabled="loading"
              @click="handleSubmit"
              v-else
            >
              this.$t({{ parsed.params.no_broadcast ? 'sign.sign' : 'sign.approve' }})
            </button>
            <button class="mb-2" @click.prevent="handleReject">
              {{ $t('common.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="p-6" v-else>
      <div class="container-sm mx-auto alert alert-error mb-6">
        {{ $t('errors.unknown') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as hiveuri from 'hive-uri'
import { Component, Vue } from 'nuxt-property-decorator'
import {
  buildSearchParams,
  getAuthority,
  getLowestAuthorityRequired,
  getVestsToSP,
  legacyToHiveUri,
  processTransaction,
  resolveTransaction,
  signComplete,
} from '~/utils'
import { AuthModule, SettingsModule } from '~/store'
import { Authority } from '~/enums'

@Component({
  layout: 'page',
})
export default class Sign extends Vue {
  private parsed = null
  private uriIsValid = true
  private loading = false
  private transactionId = ''
  private failed = false
  private error = false
  private hasRequiredKey = null
  private authority = getAuthority(this.$route.query.authority as Authority)

  private get uri(): string {
    return `hive://sign/${this.$route.params.pathMatch}${buildSearchParams(this.$route)}`
  }

  private get requestId(): string {
    return this.$route.query.requestId as string
  }

  private get title() {
    let title = this.$t('sign.confirm_transaction')
    if (this.authority) {
      title += ` (${this.authority})`
    }
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
      tx = await resolveTransaction(this.parsed, this.username)
      signedTx = await AuthModule.sign({ tx, authority: this.authority });
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
        confirmation = await AuthModule.broadcast(signedTx)
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
    if (confirmation && (this.$route.query.redirect_uri || this.parsed.params.callback)) {
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
    this.failed = false
    this.loading = false
    this.transactionId = ''
    this.$router.push('/')
  }
}
</script>
