<template>
  <single-page-layout :title="$t('developers.developers')">
    <div class="container-sm mx-auto mb-4">
      <p class="mb-6 text-black-400 text-lg">
        {{ $t('developers.description') }}
      </p>
      <developer-item :title="$t('developers.1.title')" v-model="currentItem">
        <div class="mb-4">
          <p class="mb-2" v-html="$t('developers.1.message')"></p>
          <router-link to="/profile" class="button inline-flex text-base">
            {{ $t('developers.1.enable_app') }}
          </router-link>
        </div>
        <p class="mb-2" v-html="$t('developers.1.message_hs_authorize')"></p>
      </developer-item>
      <developer-item :title="$t('developers.2.title')" v-model="currentItem">
        <p class="mb-2">{{ $t('developers.2.message') }}</p>
        <router-link to="/profile" class="button inline-flex text-base">
          {{ $t('developers.2.edit_settings') }}
        </router-link>
      </developer-item>
      <developer-item :title="$t('developers.3.title')" v-model="currentItem">
        <p class="mb-2" v-html="$t('developer.3.message_1')"></p>
        <p class="mb-2">
          <a href="https://github.com/ledgerconnect/hivesigner.js#getting-started"
             target="_blank" class="text-black hover:underline flex items-center">
            <Icon name="Github" class="mr-1"/>
            hivesigner.js
          </a>
        </p>
      </developer-item>
      <developer-item :title="$t('developers.4.title')" v-model="currentItem">
        <p class="mb-2" v-html="$t('developers.4.message')"></p>
      </developer-item>
      <developer-item :title="$t('developers.5.title')" v-model="currentItem">
        <p class="mt-2">{{ $t('developers.5.message') }}</p>
        <p class="mb-2">
          <a
            href="https://demo.hivesigner.com"
            target="_blank"
            class="text-black hover:underline mb-2"
          >{{ $t('developers.5.try_demo') }}</a>
        </p>
        <p>
          <a
            href="https://github.com/ledgerconnect/hivesigner.js/blob/master/docs/index.html"
            target="_blank"
            class="text-black hover:underline flex items-center"
          >
            <Icon name="github" class="mr-1"/>
            {{ $t('developers.5.see_gh') }}
          </a>
        </p>
      </developer-item>
      <developer-item :title="$t('developers.6.title')" v-model="currentItem">
        <p class="my-2">{{ $t('developers.6.message') }}</p>
        <p class="mb-2">
          <a
            href="https://github.com/ledgerconnect/hivesigner/wiki/What-other-ways-to-use-Hivesigner-auth%3F"
            target="_blank"
            class="text-black hover:underline"
          >{{ $t('developers.6.read_wiki') }}</a>
        </p>
      </developer-item>
      <developer-item :title="$t('developers.7.title')" v-model="currentItem">
        <p class="mb-2" v-html="$t('developers.7.message')"></p>
        <p v-if="pkg.bugs" class="mb-2">
          <a
            class="text-black hover:underline flex items-center"
            :href="pkg.bugs.url"
            target="_blank"
          >
            <Icon name="github" class="mr-1"/>
            {{ $t('about.report_bug') }}
          </a>
        </p>
        <p class="mb-2">
          <a
            class="text-black hover:underline flex items-center"
            href="https://hive.hivesigner.com"
            target="_blank"
          >
            <Icon name="bookmark" class="mr-1"/>
            {{ $t('developers.7.try_interactive') }}
          </a>
        </p>
        <p class="mb-2">
          <a
            class="text-black hover:underline flex items-center"
            href="https://discord.gg/pNJn7wh"
            target="_blank"
          >
            <Icon name="discord" class="mr-1"/>
            {{ $t('developers.7.join_discord') }}
          </a>
        </p>
      </developer-item>
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
  layout: 'page',
})
export default class Developers extends Vue {
  private currentItem: string | null = null

  private get pkg() {
    return PACKAGE
  }
}
</script>
