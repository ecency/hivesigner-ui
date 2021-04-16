<template>
  <div class="flex items-center justify-between">
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
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class Navigation extends Vue {
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
