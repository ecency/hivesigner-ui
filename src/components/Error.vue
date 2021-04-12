<template>
  <div class="flash flash-error mb-4">
    Oops, something went wrong.
    <span v-if="message">
      Here is the error message:
      <br /><b>"{{ message }}"</b>
    </span>
    <span v-else>Please try again later.</span>
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

  private get message(): string {
    return getErrorMessage(this.error);
  }
}
</script>
