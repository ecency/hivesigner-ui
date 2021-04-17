<template>
  <div class="flex items-center p-3 border rounded overflow-hidden mb-3 justify-between">
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
        <router-link class="ml-3 hover:underline cursor-pointer"
                     to="/login?redirect=accounts">
          Unlock
        </router-link>
      </span>
    </div>
    <a
      class="float-right text-primary hover:text-primary-dark p-2 cursor-pointer"
      @click="removeAccount(user)"
    >
      <Icon name="Trash"/>
    </a>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { AuthModule } from '~/store'
import { removeFromKeychain } from '~/utils'
import Icon from '~/components/UI/Icons/Icon.vue'
import Avatar from '~/components/Avatar.vue'

@Component({
  components: { Avatar, Icon }
})
export default class AccountItem extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private user!: string

  private get username(): string {
    return AuthModule.username
  }

  private logout(): Promise<void> {
    return AuthModule.logout()
  }

  private removeAccount(username): void {
    removeFromKeychain(username)
    this.$emit('load-keychain')
  }
}
</script>
