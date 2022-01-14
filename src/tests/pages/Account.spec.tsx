import React from "react";
import Accounts from "../../components/Accounts";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import renderer from "react-test-renderer";
import Enzyme, { shallow } from "enzyme";
describe("Accounts component Test", () => {
  Enzyme.configure({ adapter: new Adapter() });
  test("Header snapshot testing", () => {
    const header = renderer.create(<div className="Header" />).toJSON();
    expect(header).toMatchSnapshot();
  });
  test("menubar snapshot testing", () => {
    const menubar = renderer
      .create(<div className="AccountMenubar" />)
      .toJSON();
    expect(menubar).toMatchSnapshot();
  });

  test("each components test", () => {
    expect(shallow(<Accounts />).find(".Accountfix").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Accounts />).find(".AddButton").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Accounts />).find(".account_logo").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Accounts />).find(".AccountMenubar").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Accounts />).find(".AccountsContainer").length).toEqual(1);
  });
});
