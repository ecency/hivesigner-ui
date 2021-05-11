<template>
  <pre class="mt-2 d-inline-block font-mono text-base">{{ value | pretty }}</pre>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'

@Component
export default class OperationValueJson extends Vue {
  @Prop()
  private value!: any
}
</script>
