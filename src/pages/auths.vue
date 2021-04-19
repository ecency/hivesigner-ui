<template>
  <div class="font-old overflow-x-hidden">
    <Header :title="$t('auths.auths')" />
    <Table
      :columns="columns"
      :values="tableValues"
    >
      <template v-slot:Key="slotProps">
        <OperationValueAccount
          class="text-black"
          v-if="slotProps.cellData.type === 'account'"
          :value="slotProps.cellData.auth[0]"
        />
        <template v-else>{{ slotProps.cellData.auth[0] }}</template>
        <router-link
          v-if="slotProps.cellData.type === 'account'"
          :to="
                slotProps.cellData.authority !== 'posting'
                  ? `/revoke/${slotProps.cellData.auth[0]}?authority=${slotProps.cellData.authority}`
                  : `/revoke/${slotProps.cellData.auth[0]}`
              "
          class="button button-sm float-right"
        >
          {{ $t('revoke.revoke') }}
        </router-link>
      </template>
    </Table>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import { Component, Vue } from 'nuxt-property-decorator'
import { AuthModule } from '~/store'
import { privateKeyFrom } from '~/utils'
import { Authority } from '~/enums'
import { Account } from '@hiveio/dhive'
import Table from '~/components/UI/Table.vue'

@Component({
  components: { Table },
  middleware: ['auth'],
  layout: 'page',
})
export default class Auths extends Vue {
  private get account(): Account | null {
    return AuthModule.account
  }

  private get columns() {
    return [
      this.$t('auths.type'),
      this.$t('auths.key'),
      this.$t('auths.weight')
    ]
  }

  private get auths(): string[] {
    const auths = []

    Object.values(Authority).forEach(authority => {
      this.account[authority]?.key_auths.forEach(auth => {
        auths.push({ type: 'key', authority, auth })
      })
      this.account[authority]?.account_auths.forEach(auth => {
        auths.push({ type: 'account', authority, auth })
      })
    })
    return auths
  }

  private get publicKeys(): Record<string, string> {
    const { keys } = AuthModule
    return Object.keys(keys).reduce<Record<string, string>>((acc, b) => {
      if (!keys[b]) return acc
      acc[b] = privateKeyFrom(keys[b])
        .createPublic()
        .toString()
      return acc
    }, {})
  }

  private get tableValues(): Record<string, any>[] {
    const values = _.orderBy(this.auths, 'type')
      .map(auth => ({
        Type: auth.authority,
        Key: auth,
        Weight: auth.auth[1],
      }))
    const memo = { Type: 'memo', Key: { auth: [this.account.memo_key] }, Weight: '' }
    return [
      ...values,
      ...(this.publicKeys['memo'] === this.account.memo_key ? [memo] : []),
    ]
  }
}
</script>
