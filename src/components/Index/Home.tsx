import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ImMenu } from "react-icons/im";
import { AiOutlineClose } from "react-icons/ai";

import Navbar from "./Navbar";
import Content from "../../layouts/content";

import HomeImage from "../../assets/img/home";
import HomeLogo from "../../assets/img/logo";
import Lock from "../../assets/img/lock";
import "./Home.scss";
const Home = () => {
  const { t } = useTranslation();
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
      <div className="HomeContainer">
        <div className="Menubar" onClick={() => handleChange()}>
          {showNavbar ? <AiOutlineClose /> : <ImMenu />}
        </div>
        <div className="HomeDiv">
          <HomeImage />
          <div className="HomeTitle">{t("index.secure_way_sign_in")}</div>
        </div>
        <div className="HomeDetail">
          <div className="Header">
            <HomeLogo />
            Hivesigner
          </div>

          <div className="DetailContent">{t("index.description")}</div>
          <Link to="/import">
            <div className="Button">
              <Lock />
              {t("index.get_started")}
            </div>
          </Link>
          {showNavbar && (
            <div className="homefix">
              <Navbar />
            </div>
          )}
        </div>
      </div>
    </Content>
  );
};
export default Home;
