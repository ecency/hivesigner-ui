import React from "react";
import From from "../../components/Sign/items/Limit_Order_One";
import renderer from "react-test-renderer";
describe("Limit_order_one component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
