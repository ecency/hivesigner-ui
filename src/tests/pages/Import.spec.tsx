import React from "react";
import Home from "../../components/Index/Home";
import Import from "../../pages/import";
import renderer from "react-test-renderer";
describe("Import component Test", () => {
  test("UI Test", () => {
    const ImportRender = renderer.create(<Import />);
    let tree = ImportRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
