<template>
  <div class="container mx-auto px-4">
    <div class="grid gap-40 grid-cols-2 items-center justify-center">
      <div class="col-span-1">
        <img :src="require('../../assets/img/home.png')" alt="">
      </div>
      <div class="col-span-1">
        <div class="flex items-center mb-24">
          <img class="block pr-5" :src="require('../../assets/img/logo.svg')" alt="">
          <span class="font-bold text-5xl">Hivesigner</span>
        </div>
        <p class="text-xl text-gray pb-12">
          Secure way to sign with Hivesigner. Best security for users and developers to integrate industry standard OAuth2.
        </p>
        <router-link to="/login" class="bg-primary hover:bg-primary-dark text-white p-4 inline-flex items-center rounded-md">
          <img class="mr-2" :src="require('../../assets/img/icons/keychain.svg')">
          Get started
        </router-link>

        <div class="flex items-center pt-32">
          <locale-selector />

          <router-link
            v-for="item of menu"
            :key="item.to"
            class="px-5 text-gray text-lg hover:text-primary cursor-pointer"
            :to="item.to"
          >
            {{ item.label }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { PACKAGE } from '../../consts'

@Component({
  middleware: ['isWeb']
})
export default class Home extends Vue {
  private pkg = PACKAGE

  private get menu() {
    return [
      { label: 'Apps', to: '/apps' },
      { label: 'Accounts', to: '/accounts' },
      { label: 'Documentation', to: '/wiki' },
      { label: 'About', to: '/about' },
    ]
  }
}
</script>
