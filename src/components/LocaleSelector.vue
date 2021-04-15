<template>
  <Dropdown ref="dropdown" with-chevron trigger-class="text-black-light hover:text-primary">
    <template slot="trigger">
      <span class="text-lg uppercase">{{ locale }}</span>
    </template>
    <a
      role="button"
      class="cursor-pointer hover:text-primary"
      v-for="locale of locales"
      @click="onLocaleSelect(locale)"
    >
      {{ locale }}
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

  private locale = 'eng'

  private get locales(): string[] {
    return [
      'ENG',
      'RUS',
      'FR'
    ]
  }

  private onLocaleSelect(locale: string): void {
    this.dropdownRef.hide()
  }
}
</script>
