import React from "react";
import Navbar from "../../components/Index/Navbar";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import Enzyme, { shallow } from "enzyme";
import { Link } from "react-router-dom";
describe("Home component Test", () => {
  Enzyme.configure({ adapter: new Adapter() });

  test("function test", () => {
    // const wrapper = shallow(<Navbar />);
    //   expect(wrapper.find(Link)).toBe("/import");
  });
});
