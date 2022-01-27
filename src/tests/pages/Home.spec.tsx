import React from "react";
import Home from "../../components/Index/Home";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import renderer from "react-test-renderer";
import Enzyme, { mount, shallow } from "enzyme";
import { Link } from "react-router-dom";
describe("Home component Test", () => {
  Enzyme.configure({ adapter: new Adapter() });
  test("Snapshot testing", () => {
    const leftContainer = renderer
      .create(<div className="HomeDetail" />)
      .toJSON();
    expect(leftContainer).toMatchSnapshot();
    const menubar = renderer.create(<div className="Menubar" />).toJSON();
    expect(menubar).toMatchSnapshot();
  });

  test("each components test", () => {
    expect(shallow(<Home />).find(".HomeContainer").length).toEqual(1);
    expect(shallow(<Home />).find(".Menubar").length).toEqual(1);
    expect(shallow(<Home />).find(".HomeDiv").length).toEqual(1);
    expect(shallow(<Home />).find(".HomeTitle").length).toEqual(1);
    expect(shallow(<Home />).find(".HomeDetail").length).toEqual(1);
    expect(shallow(<Home />).find(".Header").length).toEqual(1);
    expect(shallow(<Home />).find(".DetailContent").length).toEqual(1);
    expect(shallow(<Home />).find(".Button").length).toEqual(1);
    expect(shallow(<Home />).find(".homefix").length).toEqual(1);
  });
  test("function test", () => {
    const wrapper = shallow(<Home />);
    expect(wrapper.find(Link).props().to).toEqual("/import");
  });
});
