<template>
  <portal to="modal">
    <div ref="container" class="modal">
      <transition name="fade">
        <div
          class="duration-300 cursor-pointer bg-black opacity-70 fixed top-0 left-0 right-0 bottom-0"
          v-if="open"
          @click="hide"
        ></div>
      </transition>
      <transition name="slide-bottom">
        <div
          class="modal-content overflow-y-auto w-full relative bg-white duration-300"
          v-if="open"
        >
          <div class="modal-title py-3 pl-6 pr-4 flex items-center justify-end">
            <a
              role="button"
              @click="hide"
              class="cursor-pointer text-gray hover:text-black-500 rounded-full"
            >
              <Icon name="close" style="width: 23px; height: 23px"/>
            </a>
          </div>
          <div class="modal-body h-full px-14 pb-6">
            <slot></slot>
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
export default class SideModal extends Vue {
  @Prop({
    type: String,
    default: 'right',
    validator: value => ['center', 'left', 'right'].includes(value),
  })
  private position!: string

  @Prop({
    type: String,
    default: '',
  })
  private title!: string

  @Ref('container')
  private containerRef!: HTMLElement

  private open = false

  private beforeDestroy(): void {
    this.hide()
  }

  public show(): void {
    this.open = true
    this.$modalsManager.expose()
    this.containerRef.className = 'modal flex items-center justify-center top-0 left-0 bottom-0 right-0 fixed'
  }

  public hide(): void {
    this.open = false
    this.$modalsManager.release()
    setTimeout(() => this.containerRef.className = 'modal', 300)
  }
}
</script>

<style lang="scss">
.modal {

  > .modal-content {
    max-width: 686px;
  }

  .fade-enter, .fade-leave-to {
    @apply opacity-0;
  }

  .slide-bottom-active, .slide-bottom-leave-active {
    transform: translateY(0);
  }

  .slide-bottom-enter, .slide-bottom-leave-to {
    transform: translateY(-2rem);
    @apply opacity-0;
  }
}
</style>
