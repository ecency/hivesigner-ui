<template>
  <single-page-layout :title="$t('auths.auths')" class="auths-page">
    <div class="flex flex-col w-full text-black-400 w-full overflow-hidden pt-12 px-3">
      <div class="auths-table">
        <div class="auths-cell auths-cell-header flex items-end auths-cell-type pb-2 sm:pb-0">
          {{this.$t('auths.type') }}
        </div>
        <div class="auths-cell auths-cell-header flex items-end auths-cell-key pb-2 sm:pb-0">
          {{ this.$t('auths.key') }}
        </div>
        <div class="auths-cell auths-cell-header flex items-end pb-2 sm:pb-0 auths-cell-actions"></div>
        <div
          class="auths-cell auths-cell-header items-end pb-2 sm:pb-0 hidden xl:flex auths-cell-weight">
          {{ this.$t('auths.weight') }}
        </div>
        <template v-for="value of tableValues">
          <div class="auths-cell auths-cell-type flex items-center text-gray">{{ value.Type }}</div>
          <div class="auths-cell auths-cell-key flex items-center">
            <operation-value-account
              v-if="value.Key.type === 'account'"
              :value="value.Key.auth[0]"
            />
            <operation-value
              responsive-short
              v-else
              :value="value.Key.auth[0]"
            />
          </div>
          <div class="auths-cell auths-cell-actions flex justify-end sm:justify-start items-center">
            <a
              role="button"
              class="cursor-pointer button button-sm mr-8 last:mr-0 hidden sm:block"
              v-for="option of getCellDropdownOptions(value)"
              @click="option.click({
                  clipboard: value.Key.auth[0]
                })"
            >{{ option.text }}</a>

            <Dropdown ref="dropdown" position="rightBottom" flat width="213px" class="sm:hidden">
              <template slot="trigger">
                <a role="button" class="cursor-pointer hover:text-black">
                  <Icon name="options"/>
                </a>
              </template>
              <a
                role="button"
                class="cursor-pointer p-4"
                v-for="option of getCellDropdownOptions(value)"
                @click="option.click({
                  clipboard: value.Key.auth[0]
                })"
              >{{ option.text }}</a>
            </Dropdown>
          </div>
          <div class="auths-cell auths-cell-weight hidden xl:block">{{ value.Weight }}</div>
        </template>
      </div>
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import _ from 'lodash'
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import { AuthModule } from '~/store'
import { privateKeyFrom } from '~/utils'
import { Authority } from '~/enums'
import { Account } from '@hiveio/dhive'
import SinglePageLayout from '../components/Layouts/SinglePageLayout.vue'
import Icon from '../components/UI/Icons/Icon.vue'
import Dropdown from '../components/UI/Dropdown.vue'

@Component({
  components: { Dropdown, SinglePageLayout, Icon },
  middleware: ['auth'],
  layout: 'page',
})
export default class Auths extends Vue {
  private get account(): Account | null {
    return AuthModule.account
  }

  private get auths(): string[] {
    const auths = []

    Object.values(Authority).forEach(authority => {
      this.account[authority]?.key_auths.forEach(auth => {
        auths.push({ type: 'key', authority, auth })
      })
      this.account[authority]?.account_auths.forEach(auth => {
        auths.push({ type: 'account', authority, auth })
      })
    })
    return auths
  }

  private get publicKeys(): Record<string, string> {
    const { keys } = AuthModule
    return Object.keys(keys).reduce<Record<string, string>>((acc, b) => {
      if (!keys[b]) return acc
      acc[b] = privateKeyFrom(keys[b])
        .createPublic()
        .toString()
      return acc
    }, {})
  }

  private get tableValues(): Record<string, any>[] {
    const values = _.orderBy(this.auths, 'type')
      .map(auth => ({
        Type: auth.authority,
        Key: auth,
        Weight: auth.auth[1],
      }))
    const memo = { Type: 'memo', Key: { auth: [this.account.memo_key] }, Weight: '' }
    return [
      ...values,
      ...(this.publicKeys['memo'] === this.account.memo_key ? [memo] : []),
    ]
  }

  private getRevokeLink({ authority, auth }): string {
    return authority !== 'posting' ? `/revoke/${auth[0]}?authority=${authority}` : `/revoke/${auth[0]}`
  }

  private getCellDropdownOptions(cell: Record<string, any>):
    { text: string, click: (options?: Record<string, any>) => void }[] {
    if (cell.Key.type === 'account') {
      return [
        {
          text: this.$t('revoke.revoke') as string,
          click: () => this.$router.push(this.getRevokeLink(cell.Key)),
        },
      ]
    }
    return [
      {
        text: this.$t('auths.copy') as string, click: async ({ clipboard }) => {
          await navigator.clipboard.writeText(clipboard)
          this.$popupMessages.show('auths.successfully_copied', 5000)
        }
      },
      // TODO
      {
        text: this.$t('auths.reveal_pub_key') as string, click: () => {
        }
      },
    ]
  }
}
</script>
<style lang="scss">
.auths-page {

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
