import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import SignOperation from '@/components/Signs/SignOperation.vue'
jest.mock('hive-uri')
import * as hiveUri from 'hive-uri'

describe('SignOperationComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let $t

  beforeEach(() => {
    $t = v => v
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(Vuex)
    router = new VueRouter()
    store = new Vuex.Store()
    router.push = jest.fn()

    wrapper = shallowMount(SignOperation, {
      localVue,
      router,
      store,
      mocks: {
        $t,
      },
      propsData: {
        operation: {
          name: 'Test operation',
          details: {
            name: 'test',
            authority: 'active',
            description: 'Test description',
            schema: {
              one: {
                type: 'test_type_1',
                defaultValue: undefined,
                maxLength: undefined
              },
              two: {
                type: 'test_type_2',
                defaultValue: 123,
                maxLength: 134
              }
            }
          }
        }
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should render operations controls', function () {
    expect(wrapper.findAll('form-control-stub[label=one]').length).toBe(1)
    expect(wrapper.findAll('form-control-stub[label=two]').length).toBe(1)
  })

  it('should set form on input', async function () {
    wrapper.vm.onInput('one', 'new value')
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.form.one).toBe('new value')
  })

  it('should encode op on submit', function () {
    hiveUri.encodeOp = jest.fn().mockReturnValue('hive://someurl')
    wrapper.vm.submit()
    expect(hiveUri.encodeOp).toHaveBeenCalledWith([
      'Test operation',
      {
        one: undefined,
        two: 123,
      }
    ])
    expect(router.push).toHaveBeenCalledWith('/someurl')

  })
})
