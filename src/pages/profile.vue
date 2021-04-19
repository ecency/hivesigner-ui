<template>
  <div class="font-old">
    <Header :title="$t('profile.profile')"/>
    <div class="p-6">
      <div class="container-sm mx-auto">
        <form @submit.prevent="handleSubmit" class="mb-6">
          <label class="label-light">{{ $t('profile.account_type') }}</label>
          <div class="mb-2">
            <input v-model="draft.type" type="radio" value="user" id="type-user" class="mr-2"/>
            <label for="type-user" class="mr-4 label-light">{{ $t('profile.user') }}</label>
            <input v-model="draft.type" type="radio" value="app" id="type-app" class="mr-2"/>
            <label for="type-app" class="mr-4 label-light">{{ $t('profile.app') }}</label>
          </div>
          <label for="name" class="label-light">{{ $t('profile.name') }}</label>
          <input
            v-model.trim="draft.name"
            id="name"
            name="name"
            type="text"
            class="block mb-2"
            maxlength="64"
          />
          <label for="profile_image" class="label-light">{{ $t('profile.profile_pic') }}</label>
          <input
            v-model.trim="draft.profile_image"
            id="profile_image"
            name="profile_image"
            type="text"
            class="block mb-2"
            maxlength="256"
          />
          <label for="cover_image" class="label-light">{{ $t('profile.cover_pic') }}</label>
          <input
            v-model.trim="draft.cover_image"
            id="cover_image"
            name="cover_image"
            type="text"
            class="block mb-2"
            maxlength="256"
          />
          <label for="about" class="label-light">{{ $t('profile.about') }}</label>
          <textarea
            v-model.trim="draft.about"
            id="about"
            name="about"
            type="text"
            class="block mb-2"
            maxlength="256"
            rows="3"
          ></textarea>
          <label for="website" class="label-light">{{ $t('profile.website') }}</label>
          <input
            v-model.trim="draft.website"
            id="website"
            name="website"
            type="url"
            class="block mb-2"
            maxlength="128"
            :placeholder="$t('profile.i_e_placeholder', { example: 'https://example.com' })"
          />
          <label for="location" class="label-light">{{ $t('profile.location') }}</label>
          <input
            v-model.trim="draft.location"
            id="location"
            name="location"
            type="text"
            maxlength="64"
            class="block mb-2"
          />
          <div v-if="draft.type === 'app'">
            <label for="redirect_uris" class="label-light">{{ $t('profile.redirect_uris') }}</label>
            <textarea
              v-model.trim="draft.redirect_uris"
              id="redirect_uris"
              name="redirect_uris"
              type="text"
              class="block mb-2"
              rows="3"
              :placeholder="$t('profile.i_e_placeholder', {
                example: 'https://example.com/callback'
              })"
            ></textarea>
            <div>
              <legend class="mb-2 d-block">
                {{ $t('profile.one_uri_line') }}
              </legend>
            </div>
            <label for="creator" class="label-light">{{ $t('profile.creator') }}</label>
            <input
              v-model.trim="draft.creator"
              id="creator"
              name="creator"
              type="text"
              maxlength="16"
              class="block mb-2"
            />
            <label class="label-light">{{ $t('profile.status') }}</label>
            <div class="mb-2">
              <input
                v-model="draft.is_public"
                type="radio"
                value="1"
                id="public-true"
                class="mr-2"
              />
              <label for="public-true" class="mr-4 label-light">{{ $t('profile.production') }}</label>
              <input
                v-model="draft.is_public"
                type="radio"
                value="0"
                id="public-false"
                class="mr-2"
              />
              <label for="public-false" class="mr-4 label-light">{{ $t('profile.sandbox') }}</label>
            </div>
            <label for="secret" class="label-light">{{ $t('profile.secret') }}</label>
            <input
              v-model.trim="draft.secret"
              id="secret"
              name="secret"
              type="text"
              class="block mb-2"
            />
            <div>
              <legend class="mb-2 block">
                {{ $t('profile.blank_field') }}
              </legend>
            </div>
          </div>
          <button type="submit" class="mb-2 mt-2">
            {{ $t('common.continue') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { encodeOp } from 'hive-uri'
import { createHash } from 'crypto'
import { jsonParse } from '~/utils'
import { AuthModule } from '~/store'
import { Operation } from '@hiveio/dhive'

@Component({
  middleware: ['auth'],
  layout: 'page',
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
    secret: null,
  }

  private get account(): any {
    return AuthModule.account
  }

  private get profile(): any {
    let profile = {}
    const metadata = jsonParse(this.account.posting_json_metadata)
    if (metadata.profile && typeof metadata.profile === 'object') {
      profile = metadata.profile
    }
    return profile
  }

  private mounted(): void {
    const { profile } = this
    profile.is_public = profile.is_public ? '1' : '0'
    profile.redirect_uris = profile.redirect_uris ? profile.redirect_uris.join('\n') : ''
    delete profile.secret
    this.draft = { ...this.draft, ...profile }
  }

  private handleSubmit() {
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
        posting_json_metadata: JSON.stringify(metadata),
      },
    ] as Operation
    const uri = encodeOp(op).replace('hive://', '')
    this.$router.push(uri)
  }
}
</script>
