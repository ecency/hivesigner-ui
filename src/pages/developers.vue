<template>
  <single-page-layout :title="$t('developers.developers')">
    <div class="container-sm mx-auto mb-4">
      <p class="mb-6 text-black-400 text-lg" v-html="$t('developers.description')" />
      <p class="mb-2 text-black-400" v-html="$t('developers.7.message')" />
      <p v-if="pkg.bugs" class="mb-2">
        <a
          class="text-black hover:underline flex items-center"
          :href="pkg.bugs.url"
          target="_blank"
        >
          <Icon name="github" class="mr-1" />
          {{ $t('about.report_bug') }}
        </a>
      </p>
      <p class="mb-2">
        <a
          class="text-black hover:underline flex items-center"
          href="https://hive.hivesigner.com"
          target="_blank"
        >
          <Icon name="bookmark" class="mr-1" />
          {{ $t('developers.7.try_interactive') }}
        </a>
      </p>
      <p class="mb-2">
        <a
          class="text-black hover:underline flex items-center"
          href="https://discord.gg/pNJn7wh"
          target="_blank"
        >
          <Icon name="discord" class="mr-1" />
          {{ $t('developers.7.join_discord') }}
        </a>
      </p>
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { PACKAGE } from '../consts'
import DeveloperItem from '../components/Developers/DeveloperItem.vue'
import Icon from '../components/UI/Icons/Icon.vue'
import SinglePageLayout from '../components/Layouts/SinglePageLayout.vue'

@Component({
  components: { SinglePageLayout, Icon, DeveloperItem },
  layout: 'page'
})
export default class Developers extends Vue {
  private currentItem: string | null = null

  private get pkg () {
    return PACKAGE
  }
}
</script>
