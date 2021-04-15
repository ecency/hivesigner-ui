<template>
  <div class="dropdown relative">
    <div
      class="overlay inset-0 fixed bg-black-light opacity-40"
      v-if="open" @click="open = false"
    ></div>
    <div
      class="dropdown-trigger cursor-pointer"
      :class="triggerClasses"
      @click="open = !open"
    >
      <slot name="trigger"></slot>
      <div v-if="withChevron" class="icon ml-1">
        <Icon name="chevron" />
      </div>
    </div>
    <div
      class="dropdown-menu flex flex-col bg-white p-6 absolute"
      v-if="open"
      :style="{ 'width': width }"
    >
      <div class="icon absolute right-6 top-6 cursor-pointer" @click="open = false">
        <Icon name="close" class="text-gray" />
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Icon from './Icons/Icon.vue'

@Component({
  components: { Icon }
})
export default class Dropdown extends Vue {
  @Prop({
    type: Boolean,
    default: false,
  })
  private withChevron!: boolean

  @Prop({
    type: String,
    default: '',
  })
  private triggerClass!: string

  @Prop({
    type: String,
    default: '313px',
  })
  private width!: string

  private open = false

  private get triggerClasses(): Record<string, boolean> {
    return {
      'with-chevron flex items-center': this.withChevron,
      [this.triggerClass]: true
    }
  }

  public hide(): void {
    this.open = false
  }
}
</script>
