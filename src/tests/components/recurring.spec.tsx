import React from "react";
import From from "../../components/Sign/items/recurring";
import renderer from "react-test-renderer";
describe("recurring component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
