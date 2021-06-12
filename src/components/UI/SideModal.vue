<template>
  <portal to="side-modal">
    <div class="side-modal">
      <transition name="fade">
        <div
          v-if="open"
          class="duration-300 cursor-pointer bg-black opacity-70 fixed top-0 left-0 right-0 bottom-0"
          @click="hide"
        />
      </transition>
      <transition name="slide-right">
        <div
          v-if="open"
          class="modal-content overflow-y-auto w-full fixed h-full top-0 right-0 bg-white duration-300"
        >
          <div
            class="modal-title py-5 pl-6 pr-4 flex items-center"
            :class="{
              'border-b justify-between': !flat,
              'justify-end': flat,
            }"
          >
            <span v-if="!flat" class="text-lg text-black-400">{{ title }}</span>
            <a
              role="button"
              class="cursor-pointer text-gray hover:text-black-500 rounded-full"
              @click="hide"
            >
              <Icon name="close" style="width: 23px; height: 23px" />
            </a>
          </div>
          <div class="modal-body h-full p-6">
            <slot />
          </div>
        </div>
      </transition>
    </div>
  </portal>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Icon from './Icons/Icon.vue'

@Component({
  components: { Icon }
})
export default class SideModal extends Vue {
  @Prop({
    type: String,
    default: 'right',
    validator: value => ['center', 'left', 'right'].includes(value)
  })
  private position!: string

  @Prop({
    type: String,
    default: ''
  })
  private title!: string

  @Prop({
    type: Boolean,
    default: false
  })
  private flat!: boolean

  private open = false

  private beforeDestroy (): void {
    this.hide()
  }

  public show (): void {
    this.open = true
    this.$modalsManager.expose()
  }

  public hide (): void {
    this.open = false
    this.$modalsManager.release()
  }
}
</script>

<style lang="scss">
.side-modal {

  > .modal-content {
    max-width: 500px;

    > .modal-body {
      margin-top: -63px;
    }
  }
}
</style>
