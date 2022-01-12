import React from "react";
import renderer from "react-test-renderer";
import Singer from "../../components/Sign";
describe("Singer Test", () => {
  test("snapshot renders", () => {
    const components = renderer.create(<Singer />);
    let tree = components.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
