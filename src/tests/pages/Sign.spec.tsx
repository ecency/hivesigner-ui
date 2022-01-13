import React from "react";
import Sign from "../../components/Sign";
import renderer from "react-test-renderer";
describe("Sign component Test", () => {
  test("UI Test", () => {
    const SignRender = renderer.create(<Sign />);
    let tree = SignRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
