<template>
  <div class="text-center">
    <a class="text-black hover:underline cursor-pointer truncate" @click="$emit('select')">
      <span class="mb-2 block">
        <Avatar :username="username" :size="60" />
      </span>
      {{ username }}
    </a>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'

@Component
export default class App extends Vue {
  @Prop({
    type: String,
    default: ''
  })
  private username!: string
}
</script>
