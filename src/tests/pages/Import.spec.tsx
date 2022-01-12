import React from "react";
import renderer from "react-test-renderer";
import { Login } from "../../pages/import";
describe("Login Test", () => {
  test("snapshot renders", () => {
    const components = renderer.create(<Login />);
    let tree = components.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
