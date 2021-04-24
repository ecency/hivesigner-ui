<template>
  <base-page-layout primary-page>
    <template slot="left">
      <img class="block mx-auto image" :src="require('../../assets/img/home.svg')" alt="">
      <p
        class="text-3xl sm:text-5xl xl:text-6xl font-light text-center text-black-500 sm:text-gray-550">
        {{ $t('index.secure_way_sign_in') }}
      </p>
    </template>
    <template slot="right">
      <p class="text-base sm:text-xl text-center xl:text-left text-gray pb-8 xl:pb-12">
        {{ $t('index.description') }}
      </p>
      <div class="flex justify-center xl:justify-start">
        <router-link
          to="/import?redirect=accounts"
          class="button button-primary inline-flex items-center"
        >
          <Icon name="Keychain" class="mr-2"/>
          {{ $t('index.get_started') }}
        </router-link>
      </div>
    </template>
  </base-page-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { PACKAGE } from '../../consts'
import Dropdown from '../UI/Dropdown.vue'
import Icon from '../UI/Icons/Icon.vue'
import Navigation from '../Navigation.vue'
import BasePageLayout from '../Layouts/BasePageLayout.vue'

@Component({
  components: { BasePageLayout, Navigation, Icon, Dropdown },
  middleware: ['isWeb']
})
export default class Home extends Vue {
}
</script>
<style lang="scss">
.home {
  .image {
    max-width: 242px;
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
