<template>
  <div class="home container py-20 mx-auto px-4">
    <div class="navigation-container block sm:hidden fixed top-0 right-0 pr-5 pt-5">
      <Dropdown position="rightBottom">
        <template slot="trigger">
          <Icon name="Menu" class="text-gray" />
        </template>
        <Navigation vertical />
      </Dropdown>
    </div>
    <div class="grid gap-2.5 xl:gap-40 grid-cols-2 items-center justify-center">
      <div class="col-span-2 xl:hidden">
        <div class="flex items-center justify-center mb-9">
          <Icon class="logo mr-5 text-primary" name="logo"/>
          <span class="font-bold text-3xl sm:text-4xl">Hivesigner</span>
        </div>
      </div>
      <div class="col-span-2 xl:col-span-1 sm:mb-6 xl:mb-0">
        <slot name="left"></slot>
      </div>
      <div class="col-span-2 xl:col-span-1 sm:mb-6 xl:mb-0">
        <div class="hidden xl:flex items-center mb-20">
          <Icon name="logo" class="logo text-primary mr-5"/>
          <span class="font-bold text-5xl">Hivesigner</span>
        </div>
        <slot name="right"></slot>
        <Navigation class="w-full pt-28 hidden sm:flex"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import Dropdown from '../UI/Dropdown.vue'
import Icon from '../UI/Icons/Icon.vue'
import Navigation from '../Navigation.vue'

@Component({
  components: { Navigation, Icon, Dropdown }
})
export default class BasePageLayout extends Vue {}
</script>

<style scoped>

</style>
