import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import ImportAuthKey from '@/components/Import/ImportAuthKey.vue'
jest.mock('~/store')
import * as storeModules from '~/store'

describe('ImportAuthKeyComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let $t
  let $popupMessages

  beforeEach(() => {
    storeModules.AuthModule = {
      username: ''
    }
    storeModules.AccountsModule = {
      isValidCredentials: jest.fn(),
      getAuthoritiesKeys: jest.fn(),
      saveAccountKeys: jest.fn(),
    }
    $popupMessages = {
      show: jest.fn()
    }
    $t = v => v
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(Vuex)
    router = new VueRouter()
    store = new Vuex.Store()
    router.push = jest.fn()

    wrapper = shallowMount(ImportAuthKey, {
      localVue,
      router,
      store,
      mocks: {
        $t,
        $popupMessages,
      },
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should disable button if import key not entered', async function () {
    const i = wrapper.vm.$el.innerHTML
    expect(wrapper.find('button').element.getAttribute('disabled')).toBeTruthy()

    wrapper.vm.importKey = 'some key'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').element.getAttribute('disabled')).toBeFalsy()
  })

  it('should submit and save account keys', async function () {
    storeModules.AuthModule.username = 'testUsername'
    storeModules.AccountsModule.isValidCredentials.mockReturnValue(true)
    storeModules.AccountsModule.getAuthoritiesKeys.mockReturnValue({ key1: 'key1', key2: 'key2' })

    await wrapper.vm.submit()
    expect(storeModules.AccountsModule.isValidCredentials).toHaveBeenCalled()
    expect(storeModules.AccountsModule.getAuthoritiesKeys).toHaveBeenCalled()
    expect(storeModules.AccountsModule.saveAccountKeys).toHaveBeenCalledWith({
      username: 'testUsername',
      keys: {
        key1: 'key1',
        key2: 'key2'
      }
    })
  })

  it('should emit import:success on submit', async function () {
    storeModules.AuthModule.username = 'testUsername'
    storeModules.AccountsModule.isValidCredentials.mockReturnValue(true)
    storeModules.AccountsModule.getAuthoritiesKeys.mockReturnValue({ key1: 'key1', key2: 'key2' })

    await wrapper.vm.submit()
    expect(wrapper.emitted()['import:success'][0]).toEqual([])
  })

  it('should show popup message on submit', async function () {
    storeModules.AuthModule.username = 'testUsername'
    storeModules.AccountsModule.isValidCredentials.mockReturnValue(true)
    storeModules.AccountsModule.getAuthoritiesKeys.mockReturnValue({ key1: 'key1', key2: 'key2' })

    await wrapper.vm.submit()
    expect($popupMessages.show).toHaveBeenCalledWith('auths.successfully_imported', 5000)
  })

  it('should show errors on submit', async function () {
    storeModules.AccountsModule.isValidCredentials.mockReturnValue(false)

    await wrapper.vm.submit()
    expect(wrapper.vm.errors).toEqual(['import.incorrect_private_key'])
    expect(wrapper.findAll('.errors').length).toBe(1)
  })
})
