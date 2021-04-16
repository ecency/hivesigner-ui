<template>
  <div
    class="flex justify-between"
    :class="{
      'items-center': !vertical,
      'items-start flex-col': vertical,
    }"
  >
    <locale-selector />

    <router-link
      v-for="item of menu"
      :key="item.to"
      class="text-gray text-lg hover:text-primary cursor-pointer"
      :to="item.to"
    >
      {{ item.label }}
    </router-link>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'

@Component
export default class Navigation extends Vue {
  @Prop({
    type: Boolean,
    default: false,
  })
  private vertical!: string

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
