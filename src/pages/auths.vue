<template>
  <single-page-layout :title="$t('auths.auths')" class="auths-page">
    <div class="user-info border p-6 flex items-center justify-start my-6">
      <Avatar :username="account.name" style="width: 96px; height: 96px" class="mr-5" />
      <div>
        <div class="text-xs tracking-wider uppercase text-gray">
          {{ $t('auths.username') }}
        </div>
        <div class="text-3xl">
          {{ account.name }}
        </div>
      </div>
    </div>
    <div class="flex flex-col w-full text-black-400 w-full pt-12 px-3">
      <div class="auths-table">
        <div class="auths-cell auths-cell-header flex items-end auths-cell-type pb-2 sm:pb-0">
          {{ $t('auths.type') }}
        </div>
        <div class="auths-cell auths-cell-header flex items-end auths-cell-key pb-2 sm:pb-0">
          {{ $t('auths.key') }}
        </div>
        <div
          class="auths-cell auths-cell-header flex items-end pb-2 sm:pb-0 auths-cell-actions"
        />
        <div
          class="auths-cell auths-cell-header items-end pb-2 sm:pb-0 hidden xl:flex auths-cell-weight"
        >
          {{ $t('auths.weight') }}
        </div>
        <template v-for="(value, index) of tableValues">
          <div :key="index" class="auths-cell auths-cell-type flex items-center text-gray">
            {{ value.Type }}
          </div>
          <div
            :key="index"
            class="auths-cell auths-cell-key flex items-center"
            :data-e2e="value.Type + '-key'"
          >
            <operation-value-account
              v-if="value.Key.type === 'account'"
              :value="value.Key.public"
            />
            <operation-value
              v-else
              responsive-short
              :value="privateKeysShowing[value.Type] ? value.Key.private : value.Key.public"
            />
          </div>
          <div :key="index" class="auths-cell auths-cell-actions flex justify-end sm:justify-start items-center">
            <auths-actions
              classes="cursor-pointer button button-sm mr-8 last:mr-0 hidden sm:block"
              :account="account"
              :is-private-key="privateKeysShowing[value.Type]"
              :value="value"
              @private:show="setPrivateKeyShowing(value.Type, $event)"
              @import:show="() => importModalRef.show()"
            />

            <Dropdown ref="dropdown" position="rightBottom" flat width="213px" class="sm:hidden">
              <template slot="trigger">
                <a role="button" class="cursor-pointer hover:text-black">
                  <Icon name="options" />
                </a>
              </template>
              <auths-actions
                class="flex-col"
                :account="account"
                :is-private-key="privateKeysShowing[value.Type]"
                :value="value"
                @private:show="setPrivateKeyShowing(value.Type, $event)"
                @import:show="() => importModalRef.show()"
              />
            </Dropdown>
          </div>
          <div
            :key="index"
            class="auths-cell auths-cell-weight hidden xl:block"
          >
            {{ value.Weight }}
          </div>
        </template>
      </div>
    </div>

    <modal ref="import-modal" mobile-full animation="slide-right">
      <import-auth-key @import:success="importModalRef.hide()" />
    </modal>
  </single-page-layout>
</template>

<script lang="ts">
import _ from 'lodash'
import { Account } from '@hiveio/dhive'
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import AuthsActions from '../components/Auths/AuthsActions.vue'
import Avatar from '../components/Avatar.vue'
import { AccountsModule, AuthModule } from '~/store'
import { privateKeyFrom } from '~/utils'
import { Authority } from '~/enums'
import SinglePageLayout from '~/components/Layouts/SinglePageLayout.vue'
import Icon from '~/components/UI/Icons/Icon.vue'
import Dropdown from '~/components/UI/Dropdown.vue'
import Modal from '~/components/UI/Modal.vue'
import ImportAuthKey from '~/components/Import/ImportAuthKey.vue'
import { CLIENT_OPTIONS } from '~/consts'

@Component({
  components: { Avatar, AuthsActions, ImportAuthKey, Modal, Dropdown, SinglePageLayout, Icon },
  middleware: ['auth'],
  layout: 'page'
})
export default class Auths extends Vue {
  @Ref('import-modal')
  private importModalRef!: Modal

  private privateKeysShowing: Record<string, boolean> = {}

  private get account (): Account | null {
    return AuthModule.account
  }

  private get auths (): { type: string, authority: Authority, auth: string, weight: number }[] {
    const auths = []

    Object.values(Authority).forEach((authority) => {
      this.account[authority]?.key_auths.forEach((auth) => {
        auths.push({ type: 'key', authority, auth: auth[0], weight: auth[1] })
      })
      this.account[authority]?.account_auths.forEach((auth) => {
        auths.push({ type: 'account', authority, auth: auth[0], weight: auth[1] })
      })
    })
    return auths
  }

  private get publicKeys (): Record<string, string> {
    const { keys } = AuthModule

    return Object.keys(keys).reduce<Record<string, string>>((acc, b) => {
      if (!keys[b]) {
        return acc
      }
      acc[b] = privateKeyFrom(keys[b])
        .createPublic(CLIENT_OPTIONS.addressPrefix)
        .toString()
      return acc
    }, {})
  }

  private get tableValues (): object[] {
    const values = _.orderBy(this.auths, 'type')
      .map(({ type, authority, auth, weight }) => ({
        Type: authority,
        Key: {
          public: auth,
          private: AccountsModule.accountsKeychains[this.account.name][authority],
          type
        },
        Weight: weight
      }))
    const memo = {
      Type: 'memo',
      Key: {
        public: this.account.memo_key,
        private: AccountsModule.accountsKeychains[this.account.name].memo,
        type: 'memo'
      },
      Weight: ''
    }
    return [
      ...values,
      ...(this.publicKeys.memo === this.account.memo_key ? [memo] : [])
    ]
  }

  private setPrivateKeyShowing (authority: string, value: boolean): void {
    Vue.set(this.privateKeysShowing, authority, value)
  }
}
</script>
<style lang="scss">
.auths-page {

  .user-info {
    margin-left: 0;
    margin-right: 0;

    @screen md {
      margin-left: -1.15rem;
      margin-right: -1.15rem;
    }
  }

  .auths-table {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 1fr;
    grid-auto-rows: minmax(45px, auto);

    @apply grid gap-x-6 sm:gap-7;

    @screen sm {
      grid-template-columns: auto minmax(0, 1fr) max-content;
    }

    @screen xl {
      grid-template-columns: 1fr minmax(0, 1fr) max-content 1fr;

      @apply gap-0 -m-7;

      .auths-cell {
        @apply m-7;
      }

      .auths-cell-type {
        @apply pl-16;
      }

      .auths-cell-header {
        @apply bg-gray-400 bg-opacity-10 m-0 py-3 px-7;

        &.auths-cell-type {
          @apply pl-24 -ml-1;
        }
      }
    }

    .auths-cell {

      .button {
        min-width: 80px;

        @apply text-base py-2 px-3 text-center;
      }
    }
  }
}
</style>
