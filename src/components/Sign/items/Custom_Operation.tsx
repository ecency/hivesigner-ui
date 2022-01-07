import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const CustomOperation = () => {
  const [showTab, setShowTab] = useState(false);
  const [required_auths, setInitRequiredAuths] = useState("");
  const [required_posting_auths, setInitPostingAuth] = useState("__signer");
  const [id, setInitId] = useState("");
  const [json, setInitJson] = useState("");

  const handleShow = () => {
    setShowTab(!showTab);
  };
  const handleSign = () => {
    alert("okay!!!");
  };
  return (
    <div className="Item">
      <div className="ItemHeader" id="transfer" onClick={() => handleShow()}>
        {showTab ? (
          <AiOutlineDown className="Item_icon" />
        ) : (
          <AiOutlineDown className="Item_icon_rotate" />
        )}
        <div className="Item_title">Custom operation</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">required auths</div>
            <input
              type="text"
              value={required_auths}
              onChange={(e: any) => setInitRequiredAuths(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">required posting auths</div>
            <input
              type="text"
              value={required_posting_auths}
              onChange={(e: any) => setInitPostingAuth(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">id</div>
            <input
              type="text"
              value={id}
              onChange={(e: any) => setInitId(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">json</div>
            <input
              type="text"
              value={json}
              onChange={(e: any) => setInitJson(e.target.value)}
            />
          </div>
          <div className="form_control">
            <button onClick={() => handleSign()}>Sign</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomOperation;
