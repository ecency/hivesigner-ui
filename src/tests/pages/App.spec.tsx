import React from "react";
import App from "../../components/Apps";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import renderer from "react-test-renderer";
import Enzyme, { shallow } from "enzyme";
describe("App component Test", () => {
  Enzyme.configure({ adapter: new Adapter() });
  test("Header snapshot testing", () => {
    const header = renderer.create(<div className="slider_header" />).toJSON();
    expect(header).toMatchSnapshot();
  });
  test("slider_logo snapshot testing", () => {
    const logo = renderer.create(<div className="slider_Logo" />).toJSON();
    expect(logo).toMatchSnapshot();
  });
  test("slider_container snapshot testing", () => {
    const slider_container = renderer
      .create(<div className="slider_container" />)
      .toJSON();
    expect(slider_container).toMatchSnapshot();
  });
  test("shapeheader snapshot testing", () => {
    const ShapeHeader = renderer
      .create(<div className="ShapeHeader" />)
      .toJSON();
    expect(ShapeHeader).toMatchSnapshot();
  });
  test("searchContent snapshot testing", () => {
    const SearchContent = renderer
      .create(<div className="SearchContent" />)
      .toJSON();
    expect(SearchContent).toMatchSnapshot();
  });
  test("ProductContainer snapshot testing", () => {
    const ProductContainer = renderer
      .create(<div className="ProductContainer" />)
      .toJSON();
    expect(ProductContainer).toMatchSnapshot();
  });
  test("each components test", () => {
    expect(shallow(<App />).find(".ShapeContainer").length).toEqual(1.5);
    expect(shallow(<App />).find(".ShapeHeader").length).toEqual(1);
    expect(shallow(<App />).find(".StoreTitle").length).toEqual(1);
    expect(shallow(<App />).find(".testing").length).toEqual(1);
  });
});
