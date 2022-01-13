import React from "react";
import From from "../../components/Sign/items/Recovery_Account";
import renderer from "react-test-renderer";
describe("Recovery_Account component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
