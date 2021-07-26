<template>
  <div class="apps-list">
    <p class="mb-6 font-bold text-black-400 text-lg apps-list-title">
      {{ title }}
    </p>
    <Loader v-if="loading && apps.length === 0" class="mb-6 mx-auto" />
    <div v-else class="grid grid-cols-2 md:grid-cols-4 mb-6">
      <AppItem
        v-for="app in apps.slice(0, 12)"
        :key="app"
        :username="app"
        class="mb-6"
        @select="$emit('open-modal', app)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Loader from '../UI/Loader.vue'
import AppItem from './AppItem.vue'

@Component({
  components: { Loader, AppItem }
})
export default class AppsList extends Vue {
  @Prop({
    type: String,
    default: ''
  })
  private title!: string

  @Prop({
    type: Boolean,
    default: false
  })
  private loading!: string

  @Prop({
    default: () => []
  })
  private apps!: any[]
}
</script>

<style scoped>

</style>
