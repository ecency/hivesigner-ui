import React from "react";
import From from "../../components/Sign/items/Redeem_Rewards";
import renderer from "react-test-renderer";
describe("Redeem_Rewards component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
