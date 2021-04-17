<template>
  <div>
    <p class="text-black-400 text-lg">
      You already {{ action }} the account <b>{{ username }}</b> to do
      <b>{{ authority }}</b> operations on your behalf.
    </p>
    <template v-if="callback">
      <router-link
        v-if="callback[0] === '/'"
        :to="callback"
        class="button button-primary my-2"
      >
        Continue
      </router-link>
      <a v-else :href="callback" class="button button-primary my-2">
        Continue to {{ callback | parseUrl }}
      </a>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'

@Component
export default class Already extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private username!: string

  @Prop({
    type: String,
    default: '',
  })
  private authority!: string

  @Prop({
    type: String,
    default: '',
  })
  private callback!: string

  @Prop({
    type: String,
    default: '',
  })
  private action!: string
}
</script>
