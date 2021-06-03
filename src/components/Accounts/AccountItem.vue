<template>
  <div class="account-item flex flex-col items-center">
    <div class="relative mb-3">
      <avatar display="block" :username="user" :size="60" />
      <i
        v-if="isCurrentUser"
        class="absolute bottom-0 right-0 icon-check flex items-center justify-center"
      >
        <icon name="check" />
      </i>
    </div>
    <span class="text-sm md:text-base text-black-400">{{ user }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { AuthModule } from '~/store'
import Icon from '~/components/UI/Icons/Icon.vue'
import Avatar from '~/components/Avatar.vue'

@Component({
  components: { Avatar, Icon }
})
export default class AccountItem extends Vue {
  @Prop({
    type: String,
    default: ''
  })
  private user!: string

  private get username (): string {
    return AuthModule.username
  }

  private get isCurrentUser (): boolean {
    return this.user === this.username
  }
}
</script>

<style lang="scss">
.account-item {
  .avatar {
    @screen md {
      width: 80px !important;
      height: 80px !important;
    }
  }

  .icon-check {
    width: 21px;
    height: 21px;

    @apply bg-white rounded-full;

    @screen md {
      width: 27px;
      height: 27px;
    }

    svg {
      width: 12px;
      height: 10px;

      @screen md {
        width: 15px;
        height: 12px;
      }
    }
  }
}
</style>
