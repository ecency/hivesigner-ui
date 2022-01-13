import React from "react";
import About from "../../components/About";
import renderer from "react-test-renderer";
describe("About component Test", () => {
  test("UI Test", () => {
    const about = renderer.create(<About />);
    let tree = about.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
