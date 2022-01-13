import React from "react";
import From from "../../components/Sign/items/Custom_Operation";
import renderer from "react-test-renderer";
describe("Custom_Operation component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
