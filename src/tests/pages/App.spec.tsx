import React from "react";
import renderer from "react-test-renderer";
import { App } from "../../components/Apps";
describe("App Test", () => {
  test("snapshot renders", () => {
    const components = renderer.create(<App />);
    let tree = components.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
