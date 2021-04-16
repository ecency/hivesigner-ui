<template>
  <div class="dropdown relative">
    <div
      class="overlay inset-0 fixed bg-black-light opacity-40"
      v-if="open"
      @click="open = false"
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
      class="dropdown-menu flex flex-col bg-white p-6 absolute m-2"
      v-if="open"
      :style="{ 'width': width }"
      :class="menuClasses"
    >
      <div class="icon absolute right-4 top-4 cursor-pointer" @click="open = false">
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

  @Prop({
    type: String,
    default: 'leftBottom',
    validator: (value: string) => ['leftTop', 'leftBottom', 'rightBottom', 'rightTop']
      .includes(value)
  })
  private position!: string

  private open = false

  private get triggerClasses(): Record<string, boolean> {
    return {
      'with-chevron flex items-center': this.withChevron,
      [this.triggerClass]: true,
    }
  }

  private get menuClasses(): Record<string, boolean> {
    return {
      'bottom-full -left-2': this.position === 'leftTop',
      '-left-2 bottom-full': this.position === 'leftBottom',
      'top-full -right-2': this.position === 'rightBottom',
      'bottom-full -right-2': this.position === 'rightTop',
    }
  }

  public hide(): void {
    this.open = false
  }
}
</script>
