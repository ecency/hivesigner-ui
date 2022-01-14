import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ImMenu } from "react-icons/im";
import { BsFillEyeSlashFill } from "react-icons/bs";
import { BsFillEyeFill } from "react-icons/bs";
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

  const handleCheck = () => {
    setFlag(!flag);
  };

  const togglePasswordVisiblity = () => {
    setPasswordShown(passwordShown ? false : true);
  };

  const handleInputChange = (e: any) => {
    if (e.target.name === "username") setinit_username(e.target.value);
    if (e.target.name === "password") setinit_password(e.target.value);
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
          <div className="ImportHeader">
            <div className="logo_image">
              <Logo />
            </div>
            <p>Hivesigner</p>
          </div>

          <div className="DetailContent">
            <div className="InputContainer">
              <div className="Label">Username/</div>
              <div className="InputGroup">
                <input
                  className="CustomInput"
                  type="text"
                  name="username"
                  ref={username_ref}
                  value={init_username}
                  onChange={(e: any) => handleInputChange(e)}
                  placeholder="Hive username, e.g. ecency"
                />
                <span>@</span>
              </div>
            </div>
            <div className="InputContainer">
              <div className="Label">Private key/</div>
              <div className="InputGroup">
                <div className="PasswordDiv">
                  <input
                    className="CustomInput"
                    placeholder="Password"
                    name="password"
                    type={passwordShown ? "text" : "password"}
                  />
                  <i onClick={togglePasswordVisiblity}>
                    {passwordShown ? <BsFillEyeFill /> : <BsFillEyeSlashFill />}
                  </i>
                </div>
              </div>
            </div>

            <div className="CheckDiv">
              <input type="checkbox" onChange={() => handleCheck()} />
              <span>
                Save and encrypt your login information with a password
              </span>
            </div>
            <div className="Button">
              {flag ? t("common.continue") : "Login"}
            </div>
            <div className="Signuplink">
              Don`t have an account? <Link to="/signup">Signup here</Link>
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
