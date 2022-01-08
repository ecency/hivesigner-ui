import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Navbar.scss";
const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [ShowSetting, setShowSettings] = useState(false);
  const [language, setLanguage] = useState("en");
  const handlechange = (val: any) => {
    i18n.changeLanguage(val);
    setLanguage(val);
    setShowSettings(false);
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
        {language}
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
