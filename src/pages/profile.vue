<template>
  <single-page-layout :title="$t('profile.profile')">
    <div class="container-sm mx-auto">
      <form class="mb-6" @submit.prevent="handleSubmit">
        <label class="label-light">{{ $t('profile.account_type') }}</label>
        <div class="mb-2">
          <input id="type-user" v-model="draft.type" type="radio" value="user" class="mr-2">
          <label for="type-user" class="mr-4 label-light">{{ $t('profile.user') }}</label>

          <input id="type-app" v-model="draft.type" type="radio" value="app" class="mr-2">
          <label for="type-app" class="mr-4 label-light">{{ $t('profile.app') }}</label>
        </div>
        <form-control
          v-model.trim="draft.name"
          name="name"
          :label="$t('profile.name')"
        />
        <form-control
          v-model.trim="draft.profile_image"
          name="profile_image"
          :label="$t('profile.profile_pic')"
        />
        <form-control
          v-model.trim="draft.cover_image"
          name="cover_image"
          :label="$t('profile.cover_pic')"
        />
        <form-control
          v-model.trim="draft.about"
          name="about"
          type="textarea"
          :label="$t('profile.about')"
        />
        <form-control
          v-model.trim="draft.website"
          name="website"
          :label="$t('profile.website')"
          :placeholder="$t('profile.i_e_placeholder', { example: 'https://example.com' })"
        />
        <form-control
          v-model.trim="draft.location"
          name="location"
          :label="$t('profile.location')"
        />

        <div v-if="draft.type === 'app'">
          <form-control
            v-model.trim="draft.redirect_uris"
            type="textarea"
            name="redirect_uris"
            :label="$t('profile.redirect_uris')"
            :placeholder="$t('profile.i_e_placeholder', {
              example: 'https://example.com/callback'
            })"
          />
          <div>
            <legend class="mb-2 d-block">
              {{ $t('profile.one_uri_line') }}
            </legend>
          </div>
          <form-control
            v-model.trim="draft.creator"
            name="creator"
            :label="$t('profile.creator')"
          />

          <label class="label-light">{{ $t('profile.status') }}</label>
          <div class="mb-2">
            <input
              id="public-true"
              v-model="draft.is_public"
              type="radio"
              value="1"
              class="mr-2"
            >
            <label for="public-true" class="mr-4 label-light">{{ $t('profile.production') }}</label>
            <input
              id="public-false"
              v-model="draft.is_public"
              type="radio"
              value="0"
              class="mr-2"
            >
            <label for="public-false" class="mr-4 label-light">{{ $t('profile.sandbox') }}</label>
          </div>

          <form-control
            v-model.trim="draft.secret"
            name="secret"
            :label="$t('profile.secret')"
          />
          <div>
            <legend class="mb-2 block">
              {{ $t('profile.blank_field') }}
            </legend>
          </div>
        </div>
        <button type="submit" class="button-primary mb-2 mt-2">
          {{ $t('common.continue') }}
        </button>
      </form>
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { createHash } from 'crypto'
import { Component, Vue } from 'nuxt-property-decorator'
import { encodeOp } from 'hive-uri'
import { Operation } from '@hiveio/dhive'
import SinglePageLayout from '../components/Layouts/SinglePageLayout.vue'
import FormControl from '../components/UI/Form/FormControl.vue'
import { AuthModule } from '~/store'
import { jsonParse } from '~/utils'

@Component({
  components: { FormControl, SinglePageLayout },
  middleware: ['auth'],
  layout: 'page'
})
export default class Profile extends Vue {
  private draft = {
    type: 'user',
    name: null,
    profile_image: null,
    cover_image: null,
    about: null,
    website: null,
    location: null,
    redirect_uris: null,
    creator: null,
    is_public: '0',
    secret: null
  }

  private get account (): any {
    return AuthModule.account
  }

  private get profile (): any {
    let profile = {}
    const metadata = jsonParse(this.account.posting_json_metadata)
    if (metadata.profile && typeof metadata.profile === 'object') {
      profile = metadata.profile
    }
    return profile
  }

  private mounted (): void {
    const { profile } = this
    profile.is_public = profile.is_public ? '1' : '0'
    profile.redirect_uris = profile.redirect_uris ? profile.redirect_uris.join('\n') : ''
    delete profile.secret
    this.draft = { ...this.draft, ...profile }
  }

  private handleSubmit () {
    const draft = JSON.parse(JSON.stringify(this.draft))
    draft.is_public = draft.is_public === '1'
    if (draft.secret) {
      draft.secret = createHash('sha256')
        .update(draft.secret)
        .digest('hex')
    } else {
      delete draft.secret
    }
    if (draft.redirect_uris) {
      draft.redirect_uris = draft.redirect_uris
        .split('\n')
        .map(uri => uri.trim())
        .filter(uri => uri)
    }
    Object.keys(draft).forEach(key => draft[key] == null && delete draft[key])
    const profile = { ...this.profile, ...draft }
    profile.version = 2
    let metadata = jsonParse(this.account.json_metadata)
    metadata = { ...metadata, profile }
    const op = [
      'account_update2',
      {
        account: this.account.name,
        json_metadata: '',
        posting_json_metadata: JSON.stringify(metadata)
      }
    ] as Operation
    const uri = encodeOp(op).replace('hive://', '')
    this.$router.push(uri)
  }
}
</script>
