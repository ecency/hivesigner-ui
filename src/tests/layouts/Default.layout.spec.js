import React from "react";
import { Link, Route } from "react-router-dom";
import Default from "@/layouts/default";
import * as storeModules from "@/store";

jest.mock("@/store");

describe("DefaultLayout", function () {
  let localReact;
  let router;
  let wrapper;
  let store;

  beforeEach(() => {
    localReact = createlocalReact();
    router = new Route();

    storeModules.SettingsModule = {
      loadSettings: () => Promise.resolve(),
      getDynamicGlobalProperties: () => Promise.resolve(),
    };

    wrapper = shallowMount(Default, {
      localReact,
      router,
      store,
    });
  });

  it("should create", function () {
    expect(wrapper).toBeTruthy();
  });

  it("should contain React component", function () {
    expect(wrapper.findAll("React-stub").length).toBe(1);
  });
});
