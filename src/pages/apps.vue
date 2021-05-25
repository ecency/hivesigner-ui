<template>
  <div class="h-full font-old">
    <div class="apps-hero text-center">
      <div class="mx-auto py-8 container-sm">
        <router-link to="/" class="text-white">
          <Icon name="Logo" style="width: 32px;height: 32px" class="mx-auto"/>
        </router-link>
        <div class="mt-9 mb-16">
          <h1 class="text-5xl font-bold">{{ $t('apps.store') }}</h1>
        </div>
      </div>
    </div>
    <div class="border-b">
      <Search
        v-model="search"
        class="container-sm mx-auto"
        :placeholder="$t('apps.search_placeholder')"
      />
    </div>
    <div class="container-sm mx-auto p-6 text-center">
      <template v-if="search">
        <div class="mb-6">
          <p class="font-bold mb-2">{{ $t('apps.search_for', { search }) }}</p>
          {{ filteredApps.length }} {{ $t('apps.apps') }}
        </div>
        <apps-list
          v-if="filteredApps.length > 0"
          :apps="filteredApps.slice(0, 12)"
          :loading="isLoading"
          @open-modal="openModal"
        />
        <p v-else>{{ $t('apps.empty_search', { search }) }}</p>
      </template>
      <template v-else>
        <apps-list
          title="Top apps"
          :apps="topApps"
          :loading="isLoading"
          @open-modal="openModal"
        />
        <apps-list
          title="Recently created"
          :apps="apps"
          :loading="isLoading"
          @open-modal="openModal"
        />
      </template>
      <div class="my-6">
        <navigation wrappable class="container-sm w-full" />
      </div>
    </div>
    <SideModal ref="modal" :title="selectedApp">
      <AppDetails :username="selectedApp" @close="closeModal" />
    </SideModal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'nuxt-property-decorator'
import { client, jsonParse } from '~/utils'
import { ORACLE_PERMLINK, ORACLE_USERNAME } from '~/consts'
import Icon from '~/components/UI/Icons/Icon.vue'
import AppsList from '~/components/Apps/AppsList.vue'
import AppDetails from '~/components/Apps/AppDetails.vue'
import SideModal from '~/components/UI/SideModal.vue'

@Component({
  components: { SideModal, AppDetails, AppsList, Icon },
  layout: 'page',
})
export default class Apps extends Vue {
  @Ref('modal')
  private modalRef!: SideModal

  private isLoading = false
  private search = null
  private topApps = []
  private apps = []
  private selectedApp = null

  private get filteredApps(): Record<string, string>[] {
    const apps = JSON.parse(JSON.stringify(this.apps))
    return apps
      .sort((a, b) => a.length - b.length)
      .filter(app => app.toLowerCase().includes(this.search.toLowerCase()))
  }

  private async mounted(): Promise<void> {
    this.isLoading = true
    await this.loadTopApps()
    await this.loadApps()
    this.isLoading = false
  }

  private async loadApps(): Promise<void> {
    const step = 100
    let follows = await client.call('follow_api', 'get_following', [ORACLE_USERNAME, '', 'blog', step])
    this.apps = follows.map(follow => follow.following)
    while (follows.length === step) {
      const startFrom = this.apps[this.apps.length - 1]
      // eslint-disable-next-line
      follows = await client.call('follow_api', 'get_following', [ORACLE_USERNAME, startFrom, 'blog', step])
      follows = follows.map(follow => follow.following)
      this.apps.push(...follows.slice(1))
    }
  }

  private async loadTopApps(): Promise<void> {
    const response = await client.database.call('get_content', [ORACLE_USERNAME, ORACLE_PERMLINK])
    const metadata = jsonParse(response.json_metadata)
    if (metadata.data) this.topApps = metadata.data
  }

  private openModal(username: string): void {
    this.selectedApp = username
    console.log(this.modalRef)
    this.modalRef.show()
  }

  private closeModal(): void {
    this.modalRef.hide()
  }
}
</script>

<style scoped lang="scss">
@import '../assets/scss/vars';

.apps-hero {
  color: $bg-color;
  background-color: $primary-color;
  background-image: url('../assets/img/shapes.svg');
  background-attachment: fixed;

  h1,
  h4 {
    color: $border-color;
  }

  .logo {
    color: $border-color;
  }
}
</style>
