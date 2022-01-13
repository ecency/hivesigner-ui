import React from "react";
import From from "../../components/Sign/items/powerdown";
import renderer from "react-test-renderer";
describe("powerdown component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
