import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import LocaleSelector from '@/components/LocaleSelector'

describe('LocaleSelectorComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let $i18n

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(Vuex)
    router = new VueRouter()
    $i18n = {
      locale: 'current_test_locale',
      locales: [
        { name: 'current_test_locale', code: 'current_test_locale' },
        { name: 'another_test_locale', code: 'another_test_locale' }
      ],
      setLocale: jest.fn()
    }
    store = new Vuex.Store({
      modules: {
        auth: {
          keys: {}
        }
      },
      getters: {
        username: jest.fn()
      }
    })

    wrapper = shallowMount(LocaleSelector, {
      localVue,
      router,
      store,
      mocks: {
        $t: v => v,
        $i18n
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should show current locale in template', function () {
    expect(wrapper.find('.text-lg.uppercase').element.innerHTML.trim()).toBe('current_test_locale')
  })

  it('should show all locales in template', function () {
    expect(wrapper.findAll('.cursor-pointer.py-1').length).toBe(2)
    expect(wrapper.findAll('.cursor-pointer.py-1').at(0).element.innerHTML.trim()).toBe('current_test_locale')
    expect(wrapper.findAll('.cursor-pointer.py-1').at(1).element.innerHTML.trim()).toBe('another_test_locale')
  })

  it('should set locale', function () {
    wrapper.vm.$refs.dropdown.hide = jest.fn()
    wrapper.vm.onLocaleSelect({ code: 'another_test_locale' })
    expect($i18n.setLocale).toHaveBeenCalledWith('another_test_locale')
  })
})
