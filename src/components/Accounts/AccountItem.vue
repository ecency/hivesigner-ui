<template>
  <div class="flex items-center p-3 border rounded overflow-hidden mb-3 justify-between">
    <div class="flex w-full sm:items-center flex-col sm:flex-row">
      <h4 class="flex items-center text-black-500 text-xl font-bold my-1.5">
        <Avatar :username="user" class="mr-2"/>
        {{ user }}
      </h4>
      <div v-if="user === username">
        <span class="ml-3 text-black-400">Unlocked</span>
        <router-link class="ml-3 hover:underline cursor-pointer" to="/auths">
          {{ $t('accounts.auths') }}
        </router-link>
        <a
          class="ml-3 text-primary hover:text-primary-dark cursor-pointer hover:underline"
          @click="logout"
        >
          {{ $t('accounts.logout') }}
        </a>
      </div>
      <span v-else>
        <router-link class="ml-3 hover:underline cursor-pointer" to="/login?redirect=accounts">
          {{ $t('accounts.unlock') }}
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
import { AccountsModule, AuthModule } from '~/store'
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

  private removeAccount(username: string): void {
    AccountsModule.removeAccount(username)
  }
}
</script>
