<template>
  <div>
    <p
      class="text-black-400 text-lg"
      v-html="$t('already_action_account', { action, authority, username })"
    />
    <template v-if="callback">
      <router-link
        v-if="callback[0] === '/'"
        :to="callback"
        class="button button-primary my-2"
      >
        {{ $t('common.continue') }}
      </router-link>
      <a v-else :href="callback" class="button button-primary my-2">
        {{ $t('common.continue_to', { item: parseURL(callback) }) }}
      </a>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { parseURL } from '../plugins/filter-functions'

@Component
export default class Already extends Vue {
  @Prop({
    type: String,
    default: ''
  })
  private username!: string

  @Prop({
    type: String,
    default: ''
  })
  private authority!: string

  @Prop({
    type: String,
    default: ''
  })
  private callback!: string

  @Prop({
    type: String,
    default: ''
  })
  private action!: string

  private parseURL (link: string): string {
    return parseURL(link)
  }
}
</script>
