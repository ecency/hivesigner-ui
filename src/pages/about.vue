<template>
  <single-page-layout :title="$t('about.about')">
    <div class="p-6 text-lg">
      <div class="container-sm mx-auto">
        <h2 class="text-4xl text-black font-bold mb-8">
          {{ $t('index.title') }}
        </h2>
        <div class="mb-4 text-lg text-black-400">
          <p class="mb-8">
            {{ $t('index.description') }}
          </p>
          <p class="mb-8">
            <span class="text-black">Version:</span> {{ pkg.version }}
          </p>
          <p v-if="pkg.license" class="mb-8">
            <span class="text-black">License:</span>
            {{ pkg.license }}
          </p>
          <p v-if="pkg.homepage" class="mb-2">
            <a
              :href="pkg.homepage"
              target="_blank"
              class="text-black hover:underline flex items-center"
            >
              <Icon name="Link" class="mr-2" style="width: 18px; height: 18px;" />
              {{ $t('about.website') }}
            </a>
          </p>
          <p class="mb-2">
            <a
              href="/logo.svg"
              target="_blank"
              class="text-black hover:underline flex items-center"
            >
              <Icon name="Link" class="mr-2" style="width: 18px; height: 18px;" />
              {{ $t('about.download_logo') }}
            </a>
          </p>
          <p v-if="pkg.bugs" class="mb-8">
            <a
              :href="pkg.bugs.url"
              target="_blank"
              class="text-black hover:underline flex items-center"
            >
              <Icon name="Github" class="mr-2" style="width: 18px; height: 18px" />
              {{ $t('about.report_bug') }}
            </a>
          </p>
        </div>
        <div v-if="contributors.length > 0" class="mb-8">
          <p class="text-black mb-3">
            {{ $t('about.contributors') }}:
          </p>
          <p v-for="(contributor, i) in contributors" :key="i" class="mb-2">
            <a
              class="text-black-400 hover:underline flex items-center cursor-pointer"
              :href="contributor[3]"
              target="_blank"
              rel="noopener"
            >
              {{ contributor[1] }}
            </a>
          </p>
        </div>
        <div class="text-black-400">
          {{ $t('about.maintained') }}
          <a
            href="https://ecency.com"
            class="text-blue-500 hover:underline cursor-pointer"
            target="_blank"
            rel="noopener"
          >
            Ecency Team
          </a>
          .
        </div>
      </div>
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { PACKAGE } from '../consts'
import Icon from '../components/UI/Icons/Icon.vue'
import SinglePageLayout from '../components/Layouts/SinglePageLayout.vue'

@Component({
  components: { SinglePageLayout, Icon },
  layout: 'page'
})
export default class About extends Vue {
  private get pkg () {
    return PACKAGE
  }

  private get contributors (): any[] {
    if (this.pkg.contributors) {
      return this.pkg.contributors.map(contributor =>
        /^([^<(]+?)?[ \t]*(?:<([^>(]+?)>)?[ \t]*(?:\(([^)]+?)\)|$)/gm.exec(contributor)
      )
    }
    return []
  }
}
</script>
