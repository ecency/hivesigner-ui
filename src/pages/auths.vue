<template>
  <div>
    <Header title="Auths"/>
    <table class="table width-full after-header">
      <thead>
      <tr class="border-bottom">
        <th>Type</th>
        <th>Key</th>
        <th>Weight</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(auth, i) in orderedUsers" class="border-bottom" :key="i">
        <td>{{ auth.authority }}</td>
        <td>
          <OperationValueAccount v-if="auth.type === 'account'" :value="auth.auth[0]"/>
          <template v-else>{{ auth.auth[0] }}</template>
          <router-link
            v-if="auth.type === 'account'"
            :to="
                auth.authority !== 'posting'
                  ? `/revoke/${auth.auth[0]}?authority=${auth.authority}`
                  : `/revoke/${auth.auth[0]}`
              "
            class="btn btn-sm float-right"
          >
            Revoke
          </router-link>
        </td>
        <td>{{ auth.auth[1] }}</td>
      </tr>
      <tr class="border-bottom" v-if="publicKeys['memo'] == account.memo_key">
        <td>memo</td>
        <td>{{ account.memo_key }}</td>
        <td></td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import { Component, Vue } from 'nuxt-property-decorator'
import { AuthModule } from '~/store'
import { privateKeyFrom } from '~/utils'

@Component({
  middleware: ['auth'],
})
export default class Auths extends Vue {
  private get account(): any {
    return AuthModule.account
  }

  private get auths(): string[] {
    const auths = [];
    ['owner', 'active', 'posting'].forEach(authority => {
      this.account[authority].key_auths.forEach(auth => {
        auths.push({ type: 'key', authority, auth })
      })
      this.account[authority].account_auths.forEach(auth => {
        auths.push({ type: 'account', authority, auth })
      })
    })
    return auths
  }

  private get orderedUsers(): any {
    return _.orderBy(this.auths, 'type')
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
}
</script>
