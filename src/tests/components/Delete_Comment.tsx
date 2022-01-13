import React from "react";
import From from "../../components/Sign/items/Delete_Comment";
import renderer from "react-test-renderer";
describe("Delete_Comment component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
