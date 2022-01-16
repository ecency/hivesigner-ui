import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import { useTranslation } from "react-i18next";
import "./Navbar.scss";
const Navbar = () => {
  const { i18n } = useTranslation();
  const [ShowSetting, setShowSettings] = useState(false);
  const [language, setLanguage] = useState("en");
  const handlechange = (val: any) => {
    setLanguage(val);
    setShowSettings(false);
    i18n.changeLanguage(val);
  };
  return (
    <div className="NavbarContainer">
      <Link to="/apps">Apps</Link>
      <Link to="/accounts">Accounts</Link>
      <Link to="/sign">Signer</Link>
      <a href="https://docs.hivesigner.com/h/">Docs</a>
      <Link to="/about">About</Link>
      <Link to="/import">Login</Link>
      <div className="LinkBtn" onClick={() => setShowSettings(!ShowSetting)}>
        {language}{ShowSetting ? <BiChevronUp color="black" /> : <BiChevronDown />}
      </div>
      {ShowSetting && (
        <div className="LanguageDiv">
          <div className="Language" onClick={() => handlechange("en")}>
            English
          </div>
          <div className="Language" onClick={() => handlechange("ru")}>
            Русский
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
