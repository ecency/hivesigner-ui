import React, { useState, useEffect } from "react";
import { ImMenu } from "react-icons/im";
import { BiSearch } from "react-icons/bi";
import { AiOutlineClose } from "react-icons/ai";
import Data from "./data.json";
import Navbar from "../Index/Navbar";
import Content from "../../layouts/content";
import "./index.scss";
import HomeLogo from "../../assets/img/logo-white.svg";
import { AiOutlineSelect } from "react-icons/ai";
const Index = () => {
  const [init_value, setInit_value] = useState("");
  const [count, setCount] = useState(0);
  const [showNavbar, setshowNavbar] = useState(true);
  const [showSlider, setShowSlider] = useState(false);
  const [data, setData] = useState({});
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
  let len = 0;
  const handleSearch = (e: any) => {
    setInit_value(e.target.value);
  };
  useEffect(() => {
    len = Data.length;
  }, []);
  const handleProcess = (item: any) => {
    setShowSlider(!showSlider);
    setData(item);
  };
  return (
    <Content>
      <div className="ShapeContainer">
        {showSlider && (
          <div className="slider">
            <div className="slider_header">
              <span>ecency.com</span>
              <AiOutlineClose
                className="close"
                onClick={() => {
                  setShowSlider(false);
                }}
              />
            </div>
            <div className="slider_Logo">
              <img
                src="https://images.ecency.com/u/ecency.app/avatar"
                width="50px"
                height="auto"
                alt="logo"
                draggable="false"
              />
              <h3>Ecency</h3>
              <h4>ecency.com</h4>
              <a href="https://ecency.com">visit</a>
            </div>
            <div className="slider_container">
              <h3>Creator</h3>
              <div className="person">
                <img
                  src="https://images.ecency.com/u/ecency.app/avatar"
                  width="50px"
                  height="auto"
                  alt="logo"
                  draggable="false"
                />
                <h4>good-karma</h4>
                <AiOutlineSelect />
              </div>
            </div>
          </div>
        )}

        <div className="ShapeHeader">
          <img src={HomeLogo} width="70px" height="auto" alt="logo" />
          <div className="StoreTitle">App store</div>
          <div className="AppMenubar" onClick={() => handleChange()}>
            {showNavbar ? <AiOutlineClose /> : <ImMenu />}
          </div>
        </div>
        <div className="SearchContent">
          <BiSearch className="icon" />
          <input
            type="text"
            value={init_value}
            onChange={(e: any) => handleSearch(e)}
            placeholder="Search for apps"
          />
        </div>
        {len != 0 && (
          <div className="ResultContent">
            <div className="ResultText">
              {"Search for '" + init_value + "'"}
            </div>
            <div className="ResultText">{count + "Apps"}</div>
            <div className="ResultText">
              {"We didn't find any apps for'" + init_value + "'"}
            </div>
          </div>
        )}
        <div className="ProductContainer">
          {Data.map((item: any, key: any) => (
            <div
              className="ProductItem"
              id={key}
              onClick={(item: any) => {
                handleProcess(item);
              }}
            >
              <img width="100px" src={item.avatar} alt="logo" />
              <a href={item.avatar}>{item.name}</a>
            </div>
          ))}
        </div>
        {showNavbar && (
          <div className="fix">
            <Navbar />
          </div>
        )}
      </div>
    </Content>
  );
};

export default Index;
