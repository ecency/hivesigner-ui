import React from "react";
import { shallow } from "enzyme";
import About from "../../components/About";
describe("Home component Test", () => {
  test("UI Test", () => {
    const home = shallow(<About />);
    expect(home.find("DetailContent").text()).toBe(
      "Secure way to sign with Hivesigner. Best security for users and developers to integrate industry standard OAuth2 for their Blockchain applications. Transform web 2.0 apps into web 3.0 decentralized apps."
    );
  });
});
