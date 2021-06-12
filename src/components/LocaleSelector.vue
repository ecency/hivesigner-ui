<template>
  <Dropdown
    ref="dropdown"
    with-chevron
    trigger-class="text-black-light hover:text-primary"
  >
    <template slot="trigger">
      <span class="text-lg uppercase">{{ currentLocale }}</span>
    </template>
    <a
      v-for="locale of locales"
      :key="locale.name"
      role="button"
      class="cursor-pointer py-1 hover:text-primary"
      @click="onLocaleSelect(locale)"
    >
      {{ locale.name }}
    </a>
  </Dropdown>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import { Locale } from 'vue-i18n'
import Dropdown from './UI/Dropdown.vue'

@Component({
  components: { Dropdown }
})
export default class LocaleSelector extends Vue {
  @Ref('dropdown')
  private dropdownRef!: Dropdown

  private get currentLocale (): string {
    return this.$i18n.locale
  }

  private get locales (): Locale[] {
    return this.$i18n.locales as Locale[]
  }

  private onLocaleSelect ({ code }): void {
    this.dropdownRef.hide()
    this.$i18n.setLocale(code)
  }
}
</script>
