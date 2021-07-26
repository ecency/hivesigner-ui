import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import OperationValueAmount from '@/components/Operation/OperationValueAmount'

jest.mock('@/utils')
jest.mock('@/consts')
import * as utils from '@/utils'
import * as consts from '@/consts'

describe('OperationValueAmountComponent', function () {
  let localVue
  let router
  let wrapper
  let store

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(Vuex)
    router = new VueRouter()
    store = new Vuex.Store({
    })

    utils.formatNumber.mockReturnValue(24)
    wrapper = shallowMount(OperationValueAmount, {
      localVue,
      router,
      store,
      computed: {
        vestToSP: jest.fn().mockReturnValue(2)
      },
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should render formatted value with matched regex', async function () {
    consts.VESTS_REGEX = /.*/
    await wrapper.setProps({
      value: 12,
    })
    expect(wrapper.find('span').element.innerHTML).toBe('24 HP')
  })

  it('should render value without matched regex', async function () {
    consts.VESTS_REGEX = /[a-z]+/
    await wrapper.setProps({
      value: 12,
    })
    expect(wrapper.find('span').element.innerHTML).toBe('12')
  })
})
