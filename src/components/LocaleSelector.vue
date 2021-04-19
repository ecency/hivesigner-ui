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
      role="button"
      class="cursor-pointer py-1 hover:text-primary"
      v-for="locale of locales"
      @click="onLocaleSelect(locale)"
    >
      {{ locale.name }}
    </a>
  </Dropdown>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import Dropdown from './UI/Dropdown.vue'

@Component({
  components: { Dropdown }
})
export default class LocaleSelector extends Vue {
  @Ref('dropdown')
  private dropdownRef!: Dropdown

  private get currentLocale(): string {
    return this.$i18n.locale
  }

  private get locales(): string[] {
    return this.$i18n.locales
  }

  private onLocaleSelect({ code }): void {
    this.dropdownRef.hide()
    this.$i18n.setLocale(code)
  }
}
</script>
