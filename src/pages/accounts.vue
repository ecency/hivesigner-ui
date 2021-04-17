<template>
  <div class="font-old">
    <Header title="Accounts"/>
    <div class="p-4 after-header">
      <div class="container-sm mx-auto">
        <div v-if="usernames.length > 0">
          <div
            v-for="user in usernames"
            :key="user"
            class="Box p-3 d-block border rounded-1 overflow-hidden mb-3"
          >
            <h4 class="m-0 d-inline-block">
              <Avatar :username="user" class="mr-2"/>
              {{ user }}
            </h4>
            <span v-if="user === username">
              <span class="ml-3">Unlocked</span>
              <router-link class="ml-3" to="/auths">Auths</router-link>
              <a class="ml-3 text-red" @click="logout">Log out</a>
            </span>
            <span v-else>
              <router-link class="ml-3" to="/login?redirect=accounts">Unlock</router-link>
            </span>
            <a
              class="iconfont icon-trashcan float-right text-red p-1"
              @click="removeAccount(user)"
            />
          </div>
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
import { AuthModule } from '~/store'
import { getKeychain, removeFromKeychain } from '~/utils'

@Component
export default class Accounts extends Vue {
  private usernames: string[] = []

  private get username(): string {
    return AuthModule.username
  }

  private created(): void {
    this.loadKeychain()
  }

  private logout(): Promise<void> {
    return AuthModule.logout()
  }

  private loadKeychain(): void {
    const keychain = getKeychain()
    this.usernames = Object.keys(keychain)
  }

  private removeAccount(username): void {
    removeFromKeychain(username)
    this.loadKeychain()
  }
}
</script>

<style scoped>
.icon-trashcan {
  font-size: 18px;
}
</style>
