<template>
  <div class="home container py-20 mx-auto px-4">
    <div class="navigation-container block sm:hidden fixed top-0 right-0 pr-5 pt-5">
      <Dropdown position="rightBottom">
        <template slot="trigger">
          <Icon name="Menu" class="text-gray" />
        </template>
        <navigation vertical />
      </Dropdown>
    </div>
    <div class="grid gap-2.5 xl:gap-40 grid-cols-2 items-center justify-center">
      <div class="col-span-2 xl:col-span-1 mb-6 xl:mb-0">
        <div class="flex xl:hidden items-center justify-center mb-9">
          <Icon class="logo mr-5" name="logo" />
          <span class="font-bold text-3xl sm:text-4xl">Hivesigner</span>
        </div>
        <img class="block mx-auto image" :src="require('../../assets/img/home.png')" alt="">
      </div>
      <div class="col-span-2 xl:col-span-1 flex flex-col items-center xl:items-start">
        <div class="hidden xl:flex items-center mb-24">
          <Icon name="logo" class="logo mr-5" />
          <span class="font-bold text-5xl">Hivesigner</span>
        </div>
        <p class="text-xl text-center xl:text-left text-gray pb-12">
          Secure way to sign with Hivesigner. Best security for users and developers to integrate
          industry standard OAuth2.
        </p>
        <router-link
          to="/login"
          class="bg-primary hover:bg-primary-dark text-white p-4 inline-flex items-center rounded-md"
        >
          <img class="mr-2" :src="require('../../assets/img/icons/keychain.svg')">
          Get started
        </router-link>

        <navigation class="w-full pt-32 hidden sm:flex"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { PACKAGE } from '../../consts'
import Dropdown from '../UI/Dropdown.vue'
import Icon from '../UI/Icons/Icon.vue'
import Navigation from '../Navigation.vue'

@Component({
  components: { Navigation, Icon, Dropdown },
  middleware: ['isWeb']
})
export default class Home extends Vue {
}
</script>
<style lang="scss">
.home {
  .image {
    max-width: 300px;
  }
}

@screen sm {
  .home {
    .logo {
      width: 55px;
      height: 64px;
    }

    .image {
      max-width: 450px;
    }
  }
}

@screen xl {
  .home {
    .logo {
      width: 64px;
      height: 75px;
    }

    .image {
      max-width: 492px;
    }
  }
}
</style>
