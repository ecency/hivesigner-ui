<template>
  <single-page-layout :title="$t('signs.title')">
    <div class="container-md mx-auto mb-8 relative">
      <form-control
        v-model="search"
        :placeholder="$t('signs.search_placeholder')"
      />
      <icon
        name="search"
        style="width: 29px;height: 29px;top: 22px"
        class="absolute right-4 text-gray bg-white pl-2"
      />
    </div>
    <div class="container-sm mx-auto">
      <sign-operation
        class="mb-5"
        v-for="operation of operations"
        :operation="operation"
      />
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import SinglePageLayout from '@/components/Layouts/SinglePageLayout'
import { OPERATIONS } from '~/consts'
import SignOperation from '../components/Signs/SignOperation.vue'
import FormControl from '../components/UI/Form/FormControl.vue'
import Icon from '../components/UI/Icons/Icon.vue'
import { Operation } from '~/models'

@Component({
  components: { Icon, FormControl, SignOperation, SinglePageLayout }
})
export default class Signs extends Vue {
  private search = ''

  private get operations(): { name: string, details: Operation }[] {
    return Object.keys(OPERATIONS)
    .filter(key => OPERATIONS[key].name.toLowerCase().includes(this.search.toLowerCase()) ||
      OPERATIONS[key].authority.toLowerCase().includes(this.search.toLowerCase()))
    .map(name => ({
      name,
      details: OPERATIONS[name],
    }))
  }
}
</script>

<style scoped>

</style>
