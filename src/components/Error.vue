<template>
  <div class="alert alert-error mb-4">
    {{ $t('errors.something_wrong') }}
    <span v-if="message" v-html="$t('errors.here_message', { message })" />
    <span v-else>{{ $t('common.try_again') }}</span>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { getErrorMessage } from '~/utils'
import { Errors } from '~/models'

@Component
export default class Error extends Vue {
  @Prop()
  private error: Errors

  private get message (): string {
    return getErrorMessage(this.error)
  }
}
</script>
