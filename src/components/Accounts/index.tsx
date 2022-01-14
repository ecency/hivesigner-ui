import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ImMenu } from "react-icons/im";
import { AiOutlineClose } from "react-icons/ai";
import "./index.scss";
import Content from "../../layouts/content";
import Navbar from "../Index/Navbar";
import HomeLogo from "../../assets/img/logo";

const Index = () => {
  const [showNavbar, setshowNavbar] = useState(true);
  const handleScreenChange = (mediaQuery: any) => {
    if (mediaQuery.matches) {
      setshowNavbar(true);
    } else {
      setshowNavbar(false);
    }
  };
  useEffect(() => {
    let window_width = window.matchMedia("(min-width:632px)");
    window_width.addListener(handleScreenChange);
    handleScreenChange(window_width);
    return () => {
      window_width.removeListener(handleScreenChange);
    };
  }, []);

  const handleChange = () => {
    setshowNavbar(!showNavbar);
  };
  return (
    <Content>
      <div className="AccountsContainer">
        <div className="AccountMenubar" onClick={() => handleChange()}>
          {showNavbar ? <AiOutlineClose /> : <ImMenu />}
        </div>
        <div className="Header">
          <div className="account_logo">
            <HomeLogo />
          </div>
          <span>Accounts</span>
        </div>
        <div className="AddButton">
          <Link to="/import">Add another account</Link>
        </div>
        {showNavbar && (
          <div className="Accountfix">
            <Navbar />
          </div>
        )}
      </div>
    </Content>
  );
};

export default Index;
