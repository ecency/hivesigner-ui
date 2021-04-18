<template>
  <div class="flash mb-4 overflow-hidden">
    <div class="mb-3" v-html="$t('open_external', { homepage })"></div>
    <button class="btn btn-blue" @click="openURIScheme">
      {{ $t('open_desktop_app') }}
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { PACKAGE } from '~/consts'

@Component
export default class OpenExternal extends Vue {
  @Prop()
  private uri!: string

  @Prop({
    type: Boolean,
    default: false,
  })
  private withChrome!: boolean

  private get homepage(): string {
    return PACKAGE.homepage
  }

  private openURIScheme() {
    if (this.withChrome && this.$hivesigner) {
      this.$hivesigner.sign(this.uri)
    }
  }
}
</script>
