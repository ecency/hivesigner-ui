import React from "react";
import Home from "../../components/Index/Home";
import renderer from "react-test-renderer";
describe("Home component Test", () => {
  test("UI Test", () => {
    const home = renderer.create(<Home />);
    let tree = home.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
