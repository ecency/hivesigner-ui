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

const Home = () => {
  const { t, i18n } = useTranslation();

  return (
    <Content>
      <div className="HomeContainer">
        <AiOutlineClose /> <ImMenu />
        <div className="HomeDiv">
          {/* <img
            src={HomeImage}
            alt="LOGO"
            draggable="false"
            width="500px"
            height="auto"
          /> */}
          <HomeImage />
          <div className="HomeTitle">{t("index.secure_way_sign_in")}</div>
        </div>
        <div className="HomeDetail">
          <div className="Header">
            {/* <img
              src={HomeLogo}
              draggable="false"
              width="auto"
              height="auto"
              alt="LOGO"
            /> */}
            <HomeLogo />
            Hivesigner
          </div>

          <div className="DetailContent">{t("index.description")}</div>
          <Link to="/import">
            <div className="Button">
              {/* <img src={Lock} alt="get button"></img> */}
              <Lock />
              {t("index.get_started")}
            </div>
          </Link>
        </div>
      </div>
    </Content>
  );
};
export default Home;
