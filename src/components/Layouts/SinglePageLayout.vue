<template>
  <div
    class="single-page-layout container-page mx-auto p-4 sm:py-20 w-full sm:px-9"
    :class="{
      'h-full flex flex-col items-center md:justify-center': flat
    }"
  >
    <div v-if="!flat" class="navigation-container flex justify-end">
      <dropdown class="navigation-toggle sm:hidden" position="rightBottom">
        <template slot="trigger">
          <Icon name="Menu" class="text-gray"/>
        </template>
        <navigation vertical/>
      </dropdown>
    </div>
    <router-link v-if="!flat" to="/" class="flex flex-col items-center mb-12">
      <icon class="logo text-primary" name="logo"/>
      <span class="text-primary text-center text-3xl sm:text-5xl">{{ title }}</span>
    </router-link>
    <slot></slot>
    <div class="sticky bottom-0 bg-white w-full">
      <Navigation class="container-sm mx-auto w-full mt-20 hidden sm:flex py-8" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Icon from '../UI/Icons/Icon.vue'
import Dropdown from '../UI/Dropdown.vue'
import Navigation from '../Navigation.vue'

@Component({
  components: { Navigation, Dropdown, Icon }
})
export default class SinglePageLayout extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  private title!: string

  @Prop({
    type: Boolean,
    default: false,
  })
  private flat!: boolean
}
</script>

<style lang="scss">
.single-page-layout {

  &.container-page {
    max-width: 1400px;
  }

  .logo {
    width: 24px;
    height: 30px;

    @screen sm {
      width: 55px;
      height: 64px;
    }

    @screen xl {
      width: 64px;
      height: 75px;
    }
  }
}
</style>
