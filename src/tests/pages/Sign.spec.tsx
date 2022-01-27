import React from "react";
import Sign from "../../components/Sign";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import renderer from "react-test-renderer";
import Enzyme, { shallow } from "enzyme";
describe("Sign component Test", () => {
  Enzyme.configure({ adapter: new Adapter() });
  test("1 Snapshot testing", () => {
    const SignHeader = renderer.create(<div className="SignHeader" />).toJSON();
    expect(SignHeader).toMatchSnapshot();
  });
  test("2 Snapshot testing", () => {
    const TransSearch = renderer
      .create(<div className="TransSearch" />)
      .toJSON();
    expect(TransSearch).toMatchSnapshot();
  });
  test("3 Snapshot testing", () => {
    const ResultContent = renderer
      .create(<div className="ResultContent" />)
      .toJSON();
    expect(ResultContent).toMatchSnapshot();
  });
  test("4 Snapshot testing", () => {
    const Signfix = renderer.create(<div className="Signfix" />).toJSON();
    expect(Signfix).toMatchSnapshot();
  });

  test("each components test", () => {
    expect(shallow(<Sign />).find(".homelogo").length).toEqual(1);
    expect(shallow(<Sign />).find(".Title").length).toEqual(1);
    expect(shallow(<Sign />).find(".SignMenubar").length).toEqual(1);
  });
  test("function test", () => {
    const SignInput = jest.fn();
    const component = shallow(<Sign />);
    const event = {
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find(".SignInput").at(0).simulate("change", event);
    // expect(SignInput).toBeCalled();
  });
});
