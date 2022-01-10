import React from "react";
import Sign from "@/pages/sign/_";
import Header from "@/components/Header";
import Error from "@/components/Error";
import Confirmation from "@/components/Confirmation";
import Operation from "@/components/Operation";

jest.mock("@/store");
jest.mock("@/utils");
import * as store from "@/store";
import * as utils from "@/utils";

describe("SignPage", function () {
  let localReat;
  let wrapper;
  let $router;
  let $route;
  let $t;

  function initWrapper() {
    localReat = createlocalReat();

    wrapper = shallowMount(Sign, {
      localReat,
      components: {
        Header,
        Error,
        Confirmation,
        Operation,
        RouterLink: new React(),
      },
      filters: {
        parseUrl: (value) => value,
      },
      mocks: {
        $router,
        $route,
        $t,
      },
    });
    wrapper.vm.uriIsValid = true;
  }

  beforeEach(() => {
    utils.getLowestAuthorityRequired = jest.fn();
    $t = (v) => v;
    $router = {};
    $route = {
      query: {
        authority: "posting",
      },
      params: {},
    };

    store.AuthModule = {
      username: "",
    };
    store.SettingsModule = {
      properties: {},
    };
  });

  it("should create", function () {
    initWrapper();
    expect(wrapper).toBeTruthy();
  });

  it("should show error component if failed", async function () {
    initWrapper();
    wrapper.vm.parsed = {};
    wrapper.vm.error = "my error";
    wrapper.vm.failed = true;

    await wrapper.vm.$nextTick();

    expect(
      wrapper.find("transaction-status-stub").element.getAttribute("status")
    ).toBe("failure");
  });

  it("should show confirmation if has transaction id", async function () {
    initWrapper();
    wrapper.vm.parsed = {};
    wrapper.vm.transactionId = "id";

    await wrapper.vm.$nextTick();

    expect(
      wrapper.find("transaction-status-stub").element.getAttribute("status")
    ).toBe("success");
  });

  it("should show operations from parsed tx", async function () {
    initWrapper();
    wrapper.vm.parsed = {
      params: {},
      tx: {
        params: {},
        operations: [["my-operation"], ["second-operation"]],
      },
    };

    await wrapper.vm.$nextTick();

    expect(wrapper.findAll("operation-stub").length).toBe(2);
    expect(
      wrapper.findAll("operation-stub").at(0).element.getAttribute("operation")
    ).toBe("my-operation");
  });

  it("should show callback alert inside operation", async function () {
    initWrapper();
    wrapper.vm.parsed = {
      params: {
        callback: "callback",
      },
      tx: {
        params: {},
        operations: [["my-operation"]],
      },
    };

    await wrapper.vm.$nextTick();

    expect(wrapper.find(".alert-callback").element).toBeTruthy();
  });

  it("should show required transaction key alert inside operation", async function () {
    store.AuthModule.username = "dkildar";
    initWrapper();
    wrapper.vm.hasRequiredKey = false;
    wrapper.vm.parsed = {
      params: {},
      tx: {
        params: {},
        operations: [["my-operation"]],
      },
    };

    await wrapper.vm.$nextTick();

    expect(
      wrapper.find(".alert-required-transaction-key").element
    ).toBeTruthy();
  });

  it("should show router-link for continue", async function () {
    initWrapper();
    wrapper.vm.hasRequiredKey = false;
    wrapper.vm.parsed = {
      params: {},
      tx: {
        params: {},
        operations: [["my-operation"]],
      },
    };

    await wrapper.vm.$nextTick();

    expect(wrapper.find("router-link-stub").element.innerHTML.trim()).toBe(
      "common.continue"
    );
  });

  it("should show submit button and handleSubmit", async function () {
    initWrapper();
    store.AuthModule.username = "dkildar";
    wrapper.vm.handleSubmit = jest.fn();
    wrapper.vm.hasRequiredKey = true;
    wrapper.vm.parsed = {
      params: {},
      tx: {
        params: {},
        operations: [["my-operation"]],
      },
    };

    await wrapper.vm.$nextTick();
    await wrapper.find('button[type="submit"]').trigger("click");

    expect(wrapper.vm.handleSubmit).toHaveBeenCalled();
  });

  it("should show cancel button and handle reject", async function () {
    initWrapper();
    store.AuthModule.username = "dkildar";
    wrapper.vm.handleReject = jest.fn();
    wrapper.vm.hasRequiredKey = true;
    wrapper.vm.parsed = {
      params: {},
      tx: {
        params: {},
        operations: [["my-operation"]],
      },
    };

    await wrapper.vm.$nextTick();
    await wrapper.find(".button-cancel").trigger("click");

    expect(wrapper.vm.handleReject).toHaveBeenCalled();
  });

  it("should show error state if hasn't parsed or uri is not valid", async function () {
    initWrapper();
    wrapper.vm.parsed = null;

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".alert-error").element.innerHTML.trim()).toBe(
      "errors.unknown"
    );
  });
});
