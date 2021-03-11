<template>
  <div class="flash mb-4 overflow-hidden">
    <div class="mb-3">
      We recommend you to use the HiveSigner desktop app. If you don't have this, you can download
      it from the
      <a :href="homepage" target="_blank">official site</a>.
    </div>
    <button class="btn btn-blue" @click="openURIScheme">
      Open desktop app
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import pkg from '../../package.json';

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
    return pkg.homepage
  }

  private openURIScheme() {
    if (this.withChrome && this.$hivesigner) {
      this.$hivesigner.sign(this.uri)
    }
  }
}
</script>
