import React from "react";
import About from "../../components/About";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import renderer from "react-test-renderer";
import Enzyme, { shallow } from "enzyme";
describe("About component Test", () => {
  Enzyme.configure({ adapter: new Adapter() });
  test("1 Snapshot testing", () => {
    const AboutContainer = renderer
      .create(<div className="AboutContainer" />)
      .toJSON();
    expect(AboutContainer).toMatchSnapshot();
  });
  test("each components test", () => {
    expect(shallow(<About />).find(".AboutMenubar").length).toEqual(1);
    expect(shallow(<About />).find(".Logo").length).toEqual(1);
    expect(shallow(<About />).find(".about_logo").length).toEqual(1);
    expect(shallow(<About />).find(".AboutContent").length).toEqual(1);
    expect(shallow(<About />).find(".Title").length).toEqual(1);
    expect(shallow(<About />).find(".Detail").length).toEqual(1);
    expect(shallow(<About />).find(".LinkGroup").length).toEqual(1);
    expect(shallow(<About />).find(".Contributors").length).toEqual(1);
    expect(shallow(<About />).find(".Aboutfix").length).toEqual(1);
  });
  test("function test", () => {});
});
