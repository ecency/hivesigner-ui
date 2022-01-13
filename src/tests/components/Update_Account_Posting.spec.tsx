import React from "react";
import From from "../../components/Sign/items/Update_Account_Posting";
import renderer from "react-test-renderer";
describe("Update_Account_Posting component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
