<template>
  <div class="font-old">
    <Header title="Accounts"/>
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
          <p>
            There isn't any account stored on this device,
            <router-link to="/import">click here</router-link>
            if you want to import an account.
          </p>
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

<style scoped>
.icon-trashcan {
  font-size: 18px;
}
</style>
