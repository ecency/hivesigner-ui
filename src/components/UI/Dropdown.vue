<template>
  <div class="dropdown relative z-10">
    <transition name="fade">
      <div
        v-if="open"
        class="overlay inset-0 fixed bg-black-400 opacity-40 duration-500"
        @click="hide"
      />
    </transition>
    <div
      class="dropdown-trigger cursor-pointer"
      :class="triggerClasses"
      @click="() => open ? hide() : show()"
    >
      <slot name="trigger" />
      <div v-if="withChevron" class="icon ml-1">
        <Icon name="chevron" />
      </div>
    </div>
    <transition name="fade">
      <div
        v-if="open"
        ref="dropdown-menu"
        class="dropdown-menu flex flex-col bg-white absolute m-2 duration-500 z-10"
        :style="{ 'width': width }"
        :class="menuClasses"
        @click="flat && hide()"
      >
        <div v-if="!flat" class="icon absolute right-4 top-4 cursor-pointer" @click="hide">
          <Icon name="close" class="text-gray" />
        </div>
        <slot />
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'nuxt-property-decorator'
import Icon from './Icons/Icon.vue'

@Component({
  components: { Icon }
})
export default class Dropdown extends Vue {
  @Prop({
    type: Boolean,
    default: false
  })
  private withChevron!: boolean

  @Prop({
    type: Boolean,
    default: false
  })
  private flat!: boolean

  @Prop({
    type: String,
    default: ''
  })
  private triggerClass!: string

  @Prop({
    type: String,
    default: '313px'
  })
  private width!: string

  @Prop({
    type: String,
    default: 'leftBottom',
    validator: (value: string) => ['leftTop', 'leftBottom', 'rightBottom', 'rightTop']
      .includes(value)
  })
  private position!: string

  @Ref('dropdown-menu')
  private dropdownMenuRef!: HTMLElement

  private open = false

  private calculatedPosition = null

  private get actualPosition (): string {
    return this.calculatedPosition || this.position
  }

  private get triggerClasses (): Record<string, boolean> {
    return {
      'with-chevron flex items-center': this.withChevron,
      [this.triggerClass]: true
    }
  }

  private get menuClasses (): Record<string, boolean> {
    return {
      '-bottom-2 -left-2': this.actualPosition === 'leftTop',
      '-top-2 -left-2': this.actualPosition === 'leftBottom',
      '-top-2 -right-2': this.actualPosition === 'rightBottom',
      '-bottom-2 -right-2': this.actualPosition === 'rightTop',
      'p-0 rounded-md': this.flat,
      'p-6': !this.flat
    }
  }

  public show (): void {
    this.open = true
    this.calculatePosition()
  }

  public hide (): void {
    this.open = false
    this.calculatedPosition = null
  }

  private async calculatePosition (): Promise<void> {
    await this.$nextTick()
    const { bottom, right } = this.dropdownMenuRef.getBoundingClientRect()

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    const isOutsideWindowByWidth = (windowWidth - right) < 100
    const isOutsideWindowByHeight = (windowHeight - bottom) < 100

    if (isOutsideWindowByWidth) {
      this.calculatedPosition = 'rightBottom'
    }

    if (isOutsideWindowByHeight) {
      this.calculatedPosition = 'leftTop'
    }

    if (isOutsideWindowByWidth && isOutsideWindowByHeight) {
      this.calculatedPosition = 'rightTop'
    }
  }
}
</script>
<style lang="scss">
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
