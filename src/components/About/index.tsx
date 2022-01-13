import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AiOutlineSelect, AiFillGithub } from "react-icons/ai";
import Content from "../../layouts/content";
import "./index.scss";
import HomeLogo from "../../assets/img/logo";
import { ImMenu } from "react-icons/im";
import { AiOutlineClose } from "react-icons/ai";
import Navbar from "../Index/Navbar";
const Index = () => {
  const [showNavbar, setshowNavbar] = useState(true);
  const handleChange = () => {
    setshowNavbar(!showNavbar);
  };
  useEffect(() => {
    let window_width = window.matchMedia("(min-width:630px)");
    window_width.addListener(handleScreenChange);
    handleScreenChange(window_width);
    return () => {
      window_width.removeListener(handleScreenChange);
    };
  }, []);
  const handleScreenChange = (mediaQuery: any) => {
    if (mediaQuery.matches) {
      setshowNavbar(true);
    } else {
      setshowNavbar(false);
    }
  };
  return (
    <Content>
      <div className="AboutContainer">
        <div className="AboutMenubar" onClick={() => handleChange()}>
          {showNavbar ? <AiOutlineClose /> : <ImMenu />}
        </div>
        <div className="Logo">
          {/* <img
            draggable="false"
            width="70px"
            height="auto"
            src={HomeLogo}
            alt="logo"
          /> */}
          <div className="about_logo">
            <HomeLogo />
          </div>
          <span>About</span>
        </div>
        <div className="AboutContent">
          <div className="Title">Hivesigner</div>
          <div className="Detail">
            Secure way to sign with Hivesigner. Best security for users and
            developers to integrate industry standard OAuth2 for their
            Blockchain applications. Transform web 2.0 apps into web 3.0
            decentralized apps.
          </div>
          <span>Version:1.0.1</span>
          <span>License:MIT</span>
        </div>
        <div className="LinkGroup">
          <Link to="/">
            <AiOutlineSelect />
            Website
          </Link>
          <Link to="/">
            <AiOutlineSelect />
            Download Logo
          </Link>
          <a href="https://github.com/ecency/hivesigner-ui/issues">
            <AiFillGithub />
            Report a bug
          </a>
        </div>
        <div className="Contributors">
          <span>Contributors</span>
          <a href="https://ecency.com/@good-karma">Feruz Muradov</a>
          <a href="https://ecency.com/@dkildar">Ildar Timerbaev</a>
          <a href="https://ecency.com/@zetrix">Dmytro Khomenchuk</a>
          <a href="https://ecency.com/@fabien">Fabien Marino</a>
          <a href="https://ecency.com/@sekhmet">Wiktor Tkaczyński</a>
          <a href="https://ecency.com/@jnordberg">Johan Nordberg</a>
          <a href="https://ecency.com/@wehmoen">Nico Wehmöller</a>
          <a href="https://ecency.com/@mahdiyari">Mahdi Yari</a>
          <span>
            Maintained by<a href="https://ecency.com/">Ecency Team .</a>
          </span>
        </div>
        {showNavbar && (
          <div className="Aboutfix">
            <Navbar />
          </div>
        )}
      </div>
    </Content>
  );
};

export default Index;
