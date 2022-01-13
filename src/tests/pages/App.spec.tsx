import React from "react";
import App from "../../components/Apps";
import renderer from "react-test-renderer";
describe("App component Test", () => {
  test("UI Test", () => {
    const app = renderer.create(<App />);
    let tree = app.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
