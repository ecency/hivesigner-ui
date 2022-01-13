import React from "react";
import From from "../../components/Sign/items/transfertosaving";
import renderer from "react-test-renderer";
describe("transfersaving component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
