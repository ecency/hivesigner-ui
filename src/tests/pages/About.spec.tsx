import React from "react";
import renderer from "react-test-renderer";
import { About } from "../../components/About";
describe("About Test", () => {
  test("snapshot renders", () => {
    const components = renderer.create(<About />);
    let tree = components.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
