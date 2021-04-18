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
      class="text-gray py-1 text-lg hover:text-primary cursor-pointer"
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
      { label: this.$t('footer.apps'), to: '/apps' },
      { label: this.$t('footer.accounts'), to: '/accounts' },
      { label: this.$t('footer.documentation'), to: '/developers' },
      { label: this.$t('footer.about'), to: '/about' },
    ]
  }
}
</script>
