<template>
  <div class="font-old">
    <Header :title="$t('about.about')" />
    <div class="p-6">
      <div class="container-sm mx-auto">
        <h2 class="text-3xl text-black-500 font-bold mb-2">{{ pkg.name }}</h2>
        <div class="mb-4 text-lg text-black-400">
          <p class="mb-2">
            {{ $t('index.description') }}
          </p>
          <p class="mb-2">Version: {{ pkg.version }}</p>
          <p class="mb-2" v-if="pkg.license">License: {{ pkg.license }}</p>
          <p class="mb-2" v-if="pkg.homepage">
            <a
              :href="pkg.homepage"
              target="_blank"
              class="text-black hover:underline flex items-center"
            >
              <Icon name="Link" class="mr-2" style="width: 12px; height: 12px;" />
              {{ $t('about.website') }}
            </a>
          </p>
          <p class="mb-2">
            <a
              href="/logo.svg"
              target="_blank"
              class="text-black hover:underline flex items-center"
            >
              <Icon name="Link" class="mr-2" style="width: 12px; height: 12px;" />
              {{ $t('about.download_logo') }}
            </a>
          </p>
          <p v-if="pkg.bugs">
            <a :href="pkg.bugs.url" target="_blank"
               class="text-black hover:underline flex items-center">
              <Icon name="Github" class="mr-1" />
              {{ $t('about.report_bug') }}
            </a>
          </p>
        </div>
        <div v-if="contributors.length > 0">
          <p>{{ $t('about.contributors') }}</p>
          <p class="mb-2" :key="i" v-for="(contributor, i) in contributors">
            <a
              class="text-black hover:underline flex items-center"
              :href="contributor[3]"
              target="_blank"
            >
              {{ contributor[1] }}
            </a>
            <template v-if="i !== contributors.length - 1">,</template>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { PACKAGE } from '../consts'
import Icon from '../components/UI/Icons/Icon.vue'

@Component({
  components: { Icon },
  layout: 'page',
})
export default class About extends Vue {
  private get pkg() {
    return PACKAGE
  }

  private get contributors(): any[] {
    if (this.pkg.contributors)
      return this.pkg.contributors.map(contributor =>
        /^([^<(]+?)?[ \t]*(?:<([^>(]+?)>)?[ \t]*(?:\(([^)]+?)\)|$)/gm.exec(contributor),
      )
    return []
  }
}
</script>
