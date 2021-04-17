<template>
  <div class="alert alert-success mb-4">
    Your transaction is on the way! Here is the ID of the transaction:
    <a :href="`https://hiveblocks.com/tx/${id}`" target="_blank" class="text-black hover:underline">
      {{ id }}
    </a>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'

@Component
export default class Confirmation extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private id!: string
}
</script>
