<template>
  <single-page-layout :title="$t('accounts.accounts')" class="accounts-page">
    <div class="accounts-list mx-auto">
      <div
        class="grid grid-cols-3 sm:grid-cols-4 gap-6 pt-8"
        :class="{
          'xl:hidden': slides.length > 1
        }"
      >
        <account-item
          v-for="account of accountsList"
          :key="account"
          class="cursor-pointer"
          :user="account"
          @click.native="selectAccount(account)"
        />
      </div>
      <div v-if="slides.length > 1" class="hidden xl:flex">
        <carousel per-page="1">
          <slide v-for="(slide, key) of slides" :key="key">
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-6 pt-8">
              <account-item
                v-for="account of slide"
                :key="account"
                class="cursor-pointer"
                :user="account"
                @click.native="selectAccount(account)"
              />
            </div>
          </slide>
        </carousel>
      </div>
    </div>
    <div class="flex justify-center mt-6 md:mt-20 xl:pt-10">
      <router-link to="/import" class="button button-md block text-center w-full">
        {{ $t('accounts.add_another') }}
      </router-link>
    </div>

    <side-modal ref="modal" flat>
      <account-details :account="selectedAccount" @removed="selectAccount(null)" />
    </side-modal>
  </single-page-layout>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'nuxt-property-decorator'
import SinglePageLayout from '../components/Layouts/SinglePageLayout.vue'
import SideModal from '../components/UI/SideModal.vue'
import AccountDetails from '../components/Accounts/AccountDetails.vue'
import { AccountsModule } from '~/store'
import AccountItem from '~/components/Accounts/AccountItem.vue'

@Component({
  components: { AccountDetails, SideModal, SinglePageLayout, AccountItem },
  layout: 'page'
})
export default class Accounts extends Vue {
  @Ref('modal')
  private sideModalRef!: SideModal

  private selectedAccount: string | null = null

  private get accountsList (): string[] {
    return AccountsModule.accountsUsernamesList
  }

  private get slides (): string[][] {
    const results = []
    this.accountsList.forEach((user, key) => {
      if (key % 8 === 0) {
        results.push([user])
      } else {
        results[results.length - 1].push(user)
      }
    })
    return results
  }

  private selectAccount (account: string): void {
    this.selectedAccount = account
    account ? this.sideModalRef.show() : this.sideModalRef.hide()
  }
}
</script>

<style lang="scss">
.accounts-page {

  .accounts-list {
    max-width: 635px;
  }

  .button {
    max-width: 400px;
  }

  .VueCarousel-dot {
    width: 8px !important;
    height: 8px !important;
  }

  .VueCarousel-dot--active {
    background-color: theme('colors.primary.DEFAULT') !important;
  }
}
</style>
