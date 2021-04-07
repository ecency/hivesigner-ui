import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import AuthorizeForm from '~/components/Authorize/AuthorizeForm'

describe('AuthorizeComponent', function () {
  let localVue
  let router
  let wrapper

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(VueRouter)
    router = new VueRouter()

    wrapper = shallowMount(AuthorizeForm, {
      localVue,
      router,
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })
})
