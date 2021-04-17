<template>
  <div class="font-old">
    <Header title="Accounts"/>
    <div class="p-4 after-header">
      <div class="container-sm w-full mx-auto">
        <div v-if="usernames.length > 0">
          <div
            v-for="user in usernames"
            :key="user"
            class="flex items-center p-3 border rounded overflow-hidden mb-3 justify-between"
          >
            <div class="flex w-full items-center">
              <h4 class="flex items-center text-black-500 text-xl font-bold my-1.5">
                <Avatar :username="user" class="mr-2"/>
                {{ user }}
              </h4>
              <span v-if="user === username">
              <span class="ml-3 text-black-400">Unlocked</span>
              <router-link class="ml-3 hover:underline cursor-pointer" to="/auths">Auths</router-link>
              <a
                class="ml-3 text-primary hover:text-primary-dark cursor-pointer hover:underline"
                @click="logout"
              >
                Log out
              </a>
            </span>
              <span v-else>
              <router-link class="ml-3 hover:underline cursor-pointer" to="/login?redirect=accounts">
                Unlock
              </router-link>
            </span>
            </div>
            <a
              class="float-right text-primary hover:text-primary-dark p-2 cursor-pointer"
              @click="removeAccount(user)"
            >
              <Icon name="Trash" />
            </a>
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
import Icon from '../components/UI/Icons/Icon.vue'

@Component({
  components: { Icon },
  layout: 'page',
})
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
