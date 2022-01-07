import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ImMenu } from "react-icons/im";
import { AiOutlineClose } from "react-icons/ai";
import "./Home.scss";

import Navbar from "./Navbar";
import Content from "../../layouts/content";

import HomePic from "../../assets/img/home.svg";
import HomeLogo from "../../assets/img/logo.svg";
import Lock from "../../assets/img/lock.svg";

const Home = () => {
  const [showNavbar, setshowNavbar] = useState(true);
  const { t, i18n } = useTranslation();

  const handleScreenChange = (mediaQuery: any) => {
    if (mediaQuery.matches) {
      setshowNavbar(true);
    } else {
      setshowNavbar(false);
    }
  };

  useEffect(() => {
    let window_width = window.matchMedia("(min-width:630px)");
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
      <div className="HomeContainer">
        <div className="Menubar" onClick={() => handleChange()}>
          {showNavbar ? <AiOutlineClose /> : <ImMenu />}
        </div>
        <div className="HomeDiv">
          <img
            src={HomePic}
            alt="LOGO"
            draggable="false"
            width="500px"
            height="auto"
          />
          <div className="HomeTitle">{t("Secure way to sign")}</div>
        </div>
        <div className="HomeDetail">
          <div className="Header">
            <img
              src={HomeLogo}
              draggable="false"
              width="auto"
              height="auto"
              alt="LOGO"
            />
            Hivesigner
          </div>

          <div className="DetailContent">
            Secure way to sign with Hivesigner. Best security for users and
            developers to integrate industry standard OAuth2 for their
            Blockchain applications. Transform web 2.0 apps into web 3.0
            decentralized apps.
          </div>
          <Link to="/import">
            <div className="Button">
              <img src={Lock} alt="get button"></img>Get started
            </div>
          </Link>
          {showNavbar && <Navbar />}
        </div>
      </div>
    </Content>
  );
};
export default Home;
