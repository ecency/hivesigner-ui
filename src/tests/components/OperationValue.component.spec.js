import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import OperationValue from '@/components/Operation/OperationValue'
import OperationValueAccount from '@/components/Operation/OperationValueAccount'
import OperationValueAmount from '@/components/Operation/OperationValueAmount'
import OperationValueJson from '@/components/Operation/OperationValueJson'
import OperationValueBool from '@/components/Operation/OperationValueBool'

jest.mock('@/consts')
import * as consts from '@/consts'

describe('OperationValueComponent', function () {
  let localVue
  let router
  let wrapper
  let store

  beforeEach(async () => {
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(Vuex)
    router = new VueRouter()
    store = new Vuex.Store({
    })

    wrapper = shallowMount(OperationValue, {
      localVue,
      router,
      store,
      computed: {
        username: jest.fn().mockReturnValue('username')
      },
      components: {
        OperationValueAccount,
        OperationValueAmount,
        OperationValueJson,
        OperationValueBool,
      },
      filters: {
        dateHeader: () => 'tested',
      },
    })

    await wrapper.setProps({
      schemaKey: 'key',
    })

    consts.OPERATIONS = {
      test: {
        schema: {
          key: {
            name: 'test',
          },
        },
      },
    }
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should return schema', async function () {
    await wrapper.setProps({
      path: 'test',
    })
    expect(wrapper.vm.schema).toEqual({
      name: 'test',
    })
  })

  it('should render OperationValues if values is array', async function () {
    await wrapper.setProps({
      value: ['one', 'two'],
    })
    expect(wrapper.findAll('operationvalue-stub').length).toBe(2)
  })

  it('should render OperationValues if value is object', async function () {
    const value = {
      one: 1,
      two: 2,
      three: 3,
    }
    await wrapper.setProps({
      value,
    })
    Object.entries(value).forEach(([_, value], i) => {
      expect(wrapper.findAll('div').at(i).element).toBeTruthy()
      expect(wrapper.findAll('operationvalue-stub').at(i).element.getAttribute('value')).toBe(`${value}`)
    })
  })

  it('should render OperationValueAccount if value is __signer', async function () {
    await wrapper.setProps({
      value: '__signer',
    })
    expect(wrapper.findAll('operationvalueaccount-stub').length).toBe(1)
  })

  it('should render you text if username is not set', async function () {
    wrapper = shallowMount(OperationValue, {
      localVue,
      router,
      store,
      computed: {
        username: jest.fn().mockReturnValue(null)
      },
      components: {
        OperationValueAccount,
      },
    })
    await wrapper.setProps({
      value: '__signer',
    })
    expect(wrapper.find('em').element.innerHTML).toBe('you')
  })

  it('should render ValueAccount if schema is account', async function () {
    consts.OPERATIONS = {
      test: {
        schema: {
          key: {
            name: 'test',
            type: 'account',
          },
        },
      },
    }
    await wrapper.setProps({
      path: 'test',
      value: '_another_',
    })
    expect(wrapper.find('operationvalueaccount-stub').element.getAttribute('value'))
      .toBe('_another_')
  })

  it('should render OperationValueAmount if schema is account', async function () {
    consts.OPERATIONS = {
      test: {
        schema: {
          key: {
            name: 'test',
            type: 'amount',
          },
        },
      },
    }
    await wrapper.setProps({
      path: 'test',
      value: 12,
    })
    expect(wrapper.find('operationvalueamount-stub').element.getAttribute('value'))
      .toBe('12')
  })

  it('should render OperationValueJson if schema is account', async function () {
    consts.OPERATIONS = {
      test: {
        schema: {
          key: {
            name: 'test',
            type: 'json',
          },
        },
      },
    }
    await wrapper.setProps({
      path: 'test',
      value: 12,
    })
    expect(wrapper.find('operationvaluejson-stub').element.getAttribute('value'))
      .toBe('12')
  })

  it('should render OperationValueBool if schema is account', async function () {
    consts.OPERATIONS = {
      test: {
        schema: {
          key: {
            name: 'test',
            type: 'bool',
          },
        },
      },
    }
    await wrapper.setProps({
      path: 'test',
      value: '_another_',
    })
    expect(wrapper.find('operationvaluebool-stub').element.getAttribute('value'))
      .toBe('_another_')
  })

  it('should render date if schema is account', async function () {
    consts.OPERATIONS = {
      test: {
        schema: {
          key: {
            name: 'test',
            type: 'time',
          },
        },
      },
    }
    await wrapper.setProps({
      path: 'test',
      value: '_another_',
    })
    expect(wrapper.find('span').element.innerHTML)
      .toBe('tested')
  })

  it('should render text if schema is account', async function () {
    consts.OPERATIONS = {
      test: {
        schema: {
          key: {
            name: 'test',
            type: 'another',
          },
        },
      },
    }
    await wrapper.setProps({
      path: 'test',
      value: '_another_',
    })
    expect(wrapper.find('span').element.innerHTML)
      .toBe('_another_')
  })
})
