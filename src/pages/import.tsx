import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ImMenu } from "react-icons/im";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";

import Content from "../layouts/content";
import Navbar from "../components/Index/Navbar";

import "./import.scss";
import Auth from "../assets/img/auth";
import Logo from "../assets/img/logo";

const Import = () => {
  // const { t } = jest ? { t: (s: any) => s } : useTranslation();
  const { t } = useTranslation();
  const [showNavbar, setshowNavbar] = useState(true);
  const [flag, setFlag] = useState(true);
  const [init_username, setinit_username] = useState("");
  const [init_password, setinit_password] = useState("");
  const username_ref = useRef(null);
  const [passwordShown, setPasswordShown] = useState(false);
  const [namefocus, setNamefocus] = useState(false);

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

  useEffect(() => {
    setinit_username("");
    setinit_password("");
  }, []);

  const handleChange = () => {
    setshowNavbar(!showNavbar);
  };
  const InputBlurFunc = () => {
    if (!init_username)
      setNamefocus(true);
  };

  const handleCheck = () => {
    setFlag(!flag);
  };

  const togglePasswordVisiblity = () => {
    setPasswordShown(passwordShown ? false : true);
  };

  return (
    <Content>
      <div className="ImportContainer">
        <div className="ImportMenubar" onClick={() => handleChange()}>
          {showNavbar ? <AiOutlineClose /> : <ImMenu />}
        </div>
        <div className="auth_Image">
          <Auth />
        </div>
        <div className="HomeDetail">
          <a href="/"><div className="ImportHeader">
            <div className="logo_image">
              <Logo />
            </div>
            <p>Hivesigner</p>
          </div>
          </a>

          <div className="DetailContent">
            <div className="InputContainer">
              <div className="Label">Username{(namefocus && !init_username) && <span> / Hive username is required</span>}</div>
              <div className="InputGroup">
                <input
                  className="CustomInputName"
                  type="text"
                  name="username"
                  ref={username_ref}
                  onBlur={() => InputBlurFunc()}
                  value={init_username}
                  onChange={(e: any) => setinit_username(e.target.value)}
                  placeholder="Hive username, e.g. ecency"
                />
                <span>@</span>
              </div>
            </div>
            <div className="InputContainer">
              <div className="Label">Private key</div>
              <div className="InputGroup">
                <div className="PasswordDiv">
                  <input
                    className="CustomInput"
                    placeholder="Password"
                    name="password"
                    onChange={(e: any) => setinit_password(e.target.value)}
                    type={passwordShown ? "text" : "password"}
                  />
                  <i onClick={togglePasswordVisiblity}>
                    {passwordShown ? <FiEye className="eyeIcon" /> : <FiEyeOff className="eyeIcon" />}
                  </i>
                </div>
              </div>
            </div>

            <div className="CheckDiv">
              <label />
              <input type="checkbox" className="check-radio-multi" onChange={() => handleCheck()} />
              <span>
                Save and encrypt your login information with a password
              </span>
            </div>
            <div className={`ButtonImport ${(init_username && init_password) && 'ButtonBG'}`}>
              {flag ? t("common.continue") : "Login"}
            </div>
            <div className="Signuplink">
              Don`t have an account? <a href="https://signup.hive.io/" target='_blank' className="signupLabel">Signup here</a>
            </div>
          </div>

          {showNavbar && (
            <div className="importfix">
              <Navbar />
            </div>
          )}
        </div>
      </div>
    </Content>
  );
};

export default Import;
