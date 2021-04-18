<template>
  <div class="apps-list">
    <p class="mb-6 font-bold text-black-400 text-lg">{{ title }}</p>
    <VueLoadingIndicator v-if="loading && apps.length === 0" class="big mb-6" />
    <div class="grid grid-cols-2 md:grid-cols-4 mb-6" v-else>
      <AppItem
        v-for="app in apps.slice(0, 12)"
        :username="app"
        :key="app"
        class="mb-6"
        @select="$emit('open-modal', app)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import AppItem from './AppItem.vue'

@Component({
  components: { AppItem }
})
export default class AppsList extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private title!: string

  @Prop({
    type: Boolean,
    default: false,
  })
  private loading!: string

  @Prop()
  private apps!: any[]
}
</script>

<style scoped>

</style>
