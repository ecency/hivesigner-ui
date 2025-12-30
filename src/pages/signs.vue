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
      <router-link
        v-for="messageOp of messageOperations"
        :key="messageOp.route"
        :to="{ name: messageOp.route }"
        class="flex items-center text-black-400 cursor-pointer hover:text-black text-lg mb-5"
      >
        <icon
          name="select-arrow"
          style="width: 18px;height: 9px; stroke-width: 2px"
          class="block mr-3 -rotate-90"
        />
        {{ messageOp.name }}
      </router-link>
      <sign-operation
        v-for="operation of operations"
        :key="operation.name"
        class="mb-5"
        :operation="operation"
      />
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import SinglePageLayout from '@/components/Layouts/SinglePageLayout'
import SignOperation from '../components/Signs/SignOperation.vue'
import FormControl from '../components/UI/Form/FormControl.vue'
import Icon from '../components/UI/Icons/Icon.vue'
import { OPERATIONS } from '~/consts'
import { Operation } from '~/models'

@Component({
  components: { Icon, FormControl, SignOperation, SinglePageLayout }
})
export default class Signs extends Vue {
  private search = ''

  private get messageOperations (): { name: string, route: string }[] {
    const ops = [
      { name: this.$t('message_signing.title') as string, route: 'signmessage' },
      { name: this.$t('message_verification.title') as string, route: 'verifymessage' }
    ]

    if (!this.search) {
      return ops
    }

    return ops.filter(op => op.name.toLowerCase().includes(this.search.toLowerCase()))
  }

  private get operations (): { name: string, details: Operation }[] {
    return Object.keys(OPERATIONS)
      .filter(key => OPERATIONS[key].name.toLowerCase().includes(this.search.toLowerCase()) ||
      OPERATIONS[key].authority.toLowerCase().includes(this.search.toLowerCase()))
      .map(name => ({
        name,
        details: OPERATIONS[name]
      }))
  }
}
</script>

<style scoped>

</style>
