<template>
  <div class="base-page-layout container mx-auto px-4 py-20">
    <div
      class="navigation-container grid items-center mb-7"
      :class="{ 'primary': primaryPage }"
    >
      <Dropdown class="navigation-toggle sm:hidden" position="rightBottom">
        <template slot="trigger">
          <Icon name="Menu" class="text-gray"/>
        </template>
        <Navigation vertical/>
      </Dropdown>

      <router-link
        to="/"
        class="block navigation-title xl:hidden flex items-center sm:justify-center cursor-pointer"
        :class="{ 'mb-9 justify-center': primaryPage }"
      >
        <Icon class="logo mr-5 text-primary" name="logo"/>
        <span class="font-bold text-3xl sm:text-4xl">Hivesigner</span>
      </router-link>
    </div>
    <div class="grid gap-2.5 xl:gap-40 grid-cols-2 items-center justify-center">
      <div class="col-span-2 xl:col-span-1 sm:mb-6 xl:mb-0">
        <slot name="left"></slot>
      </div>
      <div class="col-span-2 xl:col-span-1 sm:mb-6 xl:mb-0">
        <router-link to="/" class="hidden xl:flex items-center mb-20 cursor-pointer block">
          <Icon name="logo" class="logo text-primary mr-5"/>
          <span class="font-bold text-5xl">Hivesigner</span>
        </router-link>
        <slot name="right"></slot>
        <Navigation class="w-full pt-28 hidden sm:flex"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Dropdown from '../UI/Dropdown.vue'
import Icon from '../UI/Icons/Icon.vue'
import Navigation from '../Navigation.vue'

@Component({
  components: { Navigation, Icon, Dropdown }
})
export default class BasePageLayout extends Vue {
  @Prop({
    type: Boolean,
    default: false,
  })
  private primaryPage!: boolean
}
</script>

<style lang="scss">
.base-page-layout {
  .navigation-container {
    grid-template-areas: "title navigation";
    grid-template-columns: 1fr min-content;

    &.primary {
      grid-template-areas:
      "empty navigation"
      "title title";
    }

    .navigation-title {
      grid-area: title;
    }

    .navigation-toggle {
      grid-area: navigation;
    }
  }

  @screen sm {
    .logo {
      width: 55px;
      height: 64px;
    }
  }

  @screen xl {
    .logo {
      width: 64px;
      height: 75px;
    }
  }
}
</style>
