<template>
  <portal to="modal">
    <div ref="container" class="modal">
      <transition name="fade">
        <div
          v-if="open"
          class="duration-300 cursor-pointer bg-black opacity-70 fixed top-0 left-0 right-0 bottom-0"
          @click="hide"
        />
      </transition>
      <transition :name="animation">
        <div
          v-if="open"
          class="modal-content overflow-y-auto w-full relative bg-white duration-300"
          :class="{
            'h-full xl:h-auto flex flex-col justify-center': mobileFull
          }"
        >
          <div
            class="modal-title py-3 pl-6 pr-4 flex items-center justify-end"
            :class="{
              'absolute top-0 w-full': mobileFull,
            }"
          >
            <a
              role="button"
              class="cursor-pointer text-gray hover:text-black-500 rounded-full"
              @click="hide"
            >
              <Icon name="close" style="width: 23px; height: 23px" />
            </a>
          </div>
          <div
            class="modal-body sm:px-14 pb-6"
            :class="{
              'px-4': mobileFull,
              'px-14 h-full': !mobileFull,
            }"
          >
            <slot />
          </div>
        </div>
      </transition>
    </div>
  </portal>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'nuxt-property-decorator'
import Icon from './Icons/Icon.vue'

@Component({
  components: { Icon }
})
export default class Modal extends Vue {
  @Prop({
    type: String,
    default: 'slide-bottom'
  })
  private animation!: string

  @Prop({
    type: Boolean,
    default: false
  })
  private mobileFull!: boolean

  @Ref('container')
  private containerRef!: HTMLElement

  private open = false

  private beforeDestroy (): void {
    this.hide()
  }

  private get baseClassList (): string[] {
    return [
      'modal flex items-center justify-center top-0 left-0 bottom-0 right-0 fixed',
      this.mobileFull ? 'mobile-full' : ''
    ]
  }

  public show (): void {
    this.open = true
    this.$modalsManager.expose()
    this.containerRef?.className = this.baseClassList.join(' ')
  }

  public hide (): void {
    this.open = false
    this.$modalsManager.release()
    setTimeout(() => (this.containerRef?.className = 'modal'), 300)
  }
}
</script>

<style lang="scss">
.modal {

  > .modal-content {
    max-width: 686px;
  }

  &.mobile-full {

    > .modal-content {
      @apply max-w-full;

      > .modal-body {
        max-width: 550px;

        @apply mx-auto w-full;
      }
    }

    @screen sm {
      > .modal-content {
        @apply py-36;
      }
    }

    @screen xl {
      > .modal-content {
        max-width: 735px;
      }
    }
  }
}
</style>
