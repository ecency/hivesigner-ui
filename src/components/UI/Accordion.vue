<template>
  <div class="accordion">
    <div
      class="flex items-center text-black-400 cursor-pointer hover:text-black text-lg"
      :class="{
        'mb-6': open
      }"
      @click="toggle"
    >
      <icon
        name="select-arrow"
        style="width: 18px;height: 9px; stroke-width: 2px"
        class="duration-300 transform block mr-3"
        :class="{
          '-rotate-90': !open
        }"
      />
      {{ title }}
    </div>
    <slot v-if="open"></slot>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Icon from './Icons/Icon.vue'
@Component({
  components: { Icon }
})
export default class Accordion extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  private title!: string

  private open = false

  public show(): void {
    this.open = true
  }

  public hide(): void {
    this.open = false
  }

  public toggle(): void {
    this.open = !this.open
  }
}
</script>

<style scoped>

</style>
