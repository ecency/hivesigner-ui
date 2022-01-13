import React from "react";
import From from "../../components/Sign/items/Post_Or_Comment_Options";
import renderer from "react-test-renderer";
describe("post_or_comment_options component Test", () => {
  test("UI Test", () => {
    const FromRender = renderer.create(<From />);
    let tree = FromRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
