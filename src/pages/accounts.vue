<template>
  <div class="font-old">
    <Header :title="$t('accounts.accounts')"/>
    <div class="p-4">
      <div class="container-sm w-full mx-auto">
        <div v-if="usernames.length > 0">
          <AccountItem
            v-for="user in usernames"
            :key="user"
            :user="user"
            @load-keychain="loadKeychain"
          />
        </div>
        <div v-else>
          <p class="text-black-500" v-html="$t('accounts.empty')"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { getKeychain } from '~/utils'
import AccountItem from '~/components/Accounts/AccountItem.vue'

@Component({
  components: { AccountItem },
  layout: 'page',
})
export default class Accounts extends Vue {
  private usernames: string[] = []

  private created(): void {
    this.loadKeychain()
  }

  private loadKeychain(): void {
    const keychain = getKeychain()
    this.usernames = Object.keys(keychain)
  }
}
</script>

