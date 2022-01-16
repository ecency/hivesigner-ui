import React from "react";
import From from "../../components/Sign/items/Post_Or_Comment";
import renderer from "react-test-renderer";
describe("post_or_comment component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});