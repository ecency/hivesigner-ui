import React from "react";
import From from "../../components/Sign/items/Remove_Proposal";
import renderer from "react-test-renderer";
describe("Remove_Proposal component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
