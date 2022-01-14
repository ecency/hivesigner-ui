import React from "react";
import Login from "../../pages/import";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import renderer from "react-test-renderer";
import Enzyme, { shallow } from "enzyme";
describe("Login component Test", () => {
  Enzyme.configure({ adapter: new Adapter() });

  test("Snapshot testing", () => {
    const ImportContainer = renderer
      .create(<div className="ImportContainer" />)
      .toJSON();
    expect(ImportContainer).toMatchSnapshot();
  });

  test("each components test", () => {
    expect(shallow(<Login />).find(".ImportMenubar").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Login />).find(".auth_Image").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Login />).find(".ImportHeader").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Login />).find(".logo_image").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Login />).find(".InputContainer").length).toEqual(2);
  });
  test("each components test", () => {
    expect(shallow(<Login />).find(".InputGroup").length).toEqual(2);
  });
  test("each components test", () => {
    expect(shallow(<Login />).find(".CheckDiv").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Login />).find(".Button").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Login />).find(".Signuplink").length).toEqual(1);
  });
  test("each components test", () => {
    expect(shallow(<Login />).find(".importfix").length).toEqual(1);
  });
});
