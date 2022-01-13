import React from "react";
import From from "../../components/Sign/items/Cancel_Limit_Order";
import renderer from "react-test-renderer";
describe("Cancel_Limit_Order component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
