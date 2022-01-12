import React from "react";
import renderer from "react-test-renderer";
import { Account } from "../../components/Accounts";
describe("Account Test", () => {
  test("snapshot renders", () => {
    const components = renderer.create(<Account />);
    let tree = components.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
