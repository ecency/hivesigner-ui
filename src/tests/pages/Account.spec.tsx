import React from "react";
import Accounts from "../../components/Accounts";
import renderer from "react-test-renderer";
describe("Accounts component Test", () => {
  test("UI Test", () => {
    const accounts = renderer.create(<Accounts />);
    let tree = accounts.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
