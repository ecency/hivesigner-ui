import React, { useState, useEffect } from "react";
import { ImMenu } from "react-icons/im";
import { BiSearch } from "react-icons/bi";
import { AiOutlineClose } from "react-icons/ai";
import { Topapp, Recentapp } from "./data";
import Navbar from "../Index/Navbar";
import Content from "../../layouts/content";
import "./index.scss";
import HomeLogo from "../../assets/img/logo-white";
import { AiOutlineSelect } from "react-icons/ai";
const Index = () => {
  const [init_value, setInit_value] = useState("");
  const [count, setCount] = useState(0);
  const [showNavbar, setshowNavbar] = useState(true);
  const [showSlider, setShowSlider] = useState(false);
  const [slidertitle, setslidertitle] = useState("ecency");
  const [sliderlogo, setsliderlogo] = useState();
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
  let len = 0;
  const handleSearch = (e: any) => {
    setInit_value(e.target.value);
  };
  useEffect(() => {
    len = Topapp.length;
  }, []);
  const handleProcess = (item: any) => {
    setsliderlogo(item.avatar);
    setslidertitle(item.name);
    setShowSlider(!showSlider);
  };
  return (
    <Content>
      <div className="appstoreback" />
      <div className="ShapeContainer">
        <div className="ShapeHeader">
          <a href="/">
            <div className="logo_image">
              <HomeLogo />
            </div>
          </a>
          <div className="StoreTitle">App store</div>
          <div className="AppMenubar" onClick={() => handleChange()}>
            {showNavbar ? <AiOutlineClose className="aiclose" /> : <ImMenu className="aiclose" />}
          </div>
        </div>
        <div className="contentdiv">
          <div className="SearchContent">
            <BiSearch className="icon" />
            <input
              type="text"
              value={init_value}
              onChange={(e: any) => handleSearch(e)}
              placeholder="Search for apps"
            />
          </div>
          {len !== 0 && (
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
          <div className="topapps">Top apps</div>
          <div className="ProductContainer">
            {Topapp.map((item: any, key: any) => (
              <div
                className="ProductItem"
                key={key}
                onClick={() => {
                  handleProcess(item);
                }}
              >
                {item.avatar == "circle" ? <div className="circle" /> : <img width="60px" src={item.avatar} alt="logo" />}
                <p>{item.name}</p>
              </div>
            ))}
          </div>
          <div className="recentapp">Recently created</div>
          <div className="ProductContainer">
            {Recentapp.map((item: any, key: any) => (
              <div
                className="ProductItem"
                key={key}
                onClick={() => {
                  handleProcess(item);
                }}
              >
                {item.avatar == "circle" ? <div className="circle" /> : <img width="60px" src={item.avatar} alt="logo" />}
                <p>{item.name}</p>
              </div>
            ))}
          </div>
          {showNavbar && (
            <div className="fix">
              <div className="ResBack" onClick={() => setshowNavbar(!showNavbar)} />
              <Navbar />
            </div>
          )}
        </div>
      </div>
      {
        showSlider && (
          <div className="slideOut">
            <div className="sliderbackground" onClick={() => setShowSlider(false)} />
            <div className="slider">
              <div className="slider_header">
                <span>{slidertitle}</span>
                <AiOutlineClose
                  className="close"
                  onClick={() => {
                    setShowSlider(false);
                  }}
                />
              </div>
              <div className="sliderlogopart">
                <div className="Logotopline" />
                {sliderlogo === "circle" ? <div className="circle" /> : <img src={sliderlogo} width={70} />}
                <div className="slidertitlepart">{slidertitle.split('.')[0].toUpperCase()}</div>
                <div className="aboutpart">
                  <p>About</p>
                  {slidertitle}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </Content >
  );
};

export default Index;
