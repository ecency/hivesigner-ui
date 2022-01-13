import React from "react";
import From from "../../components/Sign/items/Update_Account_Active";
import renderer from "react-test-renderer";
describe("Update_Account_Active component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
