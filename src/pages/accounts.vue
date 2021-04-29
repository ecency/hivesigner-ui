<template>
  <div class="font-old">
    <Header :title="$t('accounts.accounts')"/>
    <div class="p-4">
      <div class="container-sm w-full mx-auto">
        <div v-if="accountsList.length > 0">
          <AccountItem
            v-for="user in accountsList"
            :key="user"
            :user="user"
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
import AccountItem from '~/components/Accounts/AccountItem.vue'
import { AccountsModule } from '~/store'

@Component({
  components: { AccountItem },
  layout: 'page',
})
export default class Accounts extends Vue {
  private get accountsList(): string[] {
    return AccountsModule.accountsUsernamesList
  }
}
</script>

