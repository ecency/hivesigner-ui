<template>
  <div
    class="flex"
    :class="{
      'items-center': !vertical,
      'items-start flex-col': vertical,
      'justify-between': !wrappable,
      'justify-center md:justify-center flex-wrap': wrappable
    }"
  >
    <template v-for="item of menu">
      <router-link
        v-if="item.to"
        :key="item.to"
        class="text-gray py-1.5 text-lg hover:text-primary cursor-pointer"
        :to="item.to"
        :class="{
          'px-2': wrappable
        }"
      >
        {{ item.label }}
      </router-link>
      <a
        v-else-if="item.href"
        :key="item.to"
        :href="item.href"
        target="_blank"
        rel="noopener"
        class="text-gray py-1.5 text-lg hover:text-primary cursor-pointer"
        :class="{
          'px-2': wrappable
        }"
      >{{ item.label }}</a>
    </template>
    <locale-selector
      class="py-1.5"
      :class="{
        'px-2': wrappable
      }"
    />
    <account-selection v-if="hasAuthorizedAccount" class="hidden md:block" />
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import AccountSelection from './AccountSelection.vue'
import { AuthModule } from '~/store'

@Component({
  components: { AccountSelection }
})
export default class Navigation extends Vue {
  @Prop({
    type: Boolean,
    default: false
  })
  private vertical!: string

  @Prop({
    type: Boolean,
    default: false
  })
  private wrappable!: string

  private get hasAuthorizedAccount (): boolean {
    return !!AuthModule.username
  }

  private get menu () {
    return [
      { label: this.$t('footer.apps'), to: '/apps' },
      { label: this.$t('footer.accounts'), to: '/accounts' },
      { label: this.$t('footer.signs'), to: '/signs' },
      { label: this.$t('footer.documentation'), href: 'https://docs.hivesigner.com/' },
      { label: this.$t('footer.about'), to: '/about' },
      ...(!this.hasAuthorizedAccount ? [{ label: this.$t('footer.login'), to: '/login?redirect=accounts' }] : [])
      // { label: this.$t('footer.network', {network: process.env.BROADCAST_NETWORK === 'testnet' ? 'T' : '' }), to: '/about' },
    ]
  }
}
</script>
