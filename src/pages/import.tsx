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
import AuthSvg from "../assets/img/auth.svg";
import HomeLogo from "../assets/img/logo.svg";

const Import = () => {
  const { t, i18n } = useTranslation();
  const [showNavbar, setshowNavbar] = useState(true);
  const [flag, setFlag] = useState(true);
  const [init_username, setinit_username] = useState("");
  const [init_password, setinit_password] = useState("");
  const username_ref = useRef(null);
  const password_ref = useRef(null);
  const [passwordShown, setPasswordShown] = useState(false);

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
    if (e.target.name == "username") setinit_username(e.target.value);
    if (e.target.name == "password") setinit_password(e.target.value);
  };

  return (
    <Content>
      <div className="ImportContainer">
        <div className="ImportMenubar" onClick={() => handleChange()}>
          {showNavbar ? <AiOutlineClose /> : <ImMenu />}
        </div>
        <img src={AuthSvg} alt="import_logo" />
        <div className="HomeDetail">
          <div className="ImportHeader">
            <img
              src={HomeLogo}
              draggable="false"
              width="auto"
              height="auto"
              alt="LOGO"
            />
            <p>Hivesigner</p>
          </div>

          <div className="DetailContent">
            <div className="InputContainer">
              <div className="Label">
                Username/
                {/* <span>
                  {!username_ref || !init_username
                    ? "Hive username is required"
                    : null}
                </span> */}
              </div>
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
              <div className="Label">
                Private key/
                {/* <span>
                  {!password_ref || !init_password
                    ? "Hive private key is required"
                    : null}
                </span> */}
              </div>
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
              <b></b>
              <span>
                Save and encrypt your login information with a password
              </span>
            </div>
            <div
              className="Button"
              // state={init_password == "" || init_username == "" ? 0.75 : 1}
            >
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
