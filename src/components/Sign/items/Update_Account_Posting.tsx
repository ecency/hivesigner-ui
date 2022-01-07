import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const AccountPosting = () => {
  const [showTab, setShowTab] = useState(false);
  const [account, setInitAccount] = useState("__signer");
  const [extensions, setInitExtensions] = useState("");
  const [posting_json_metadata, setInitPostingJson] = useState("");
  const [json_metadata, setInitJsonMetadata] = useState("");
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
        <div className="Item_title">Update account(posting)</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">account</div>
            <input
              type="text"
              value={account}
              onChange={(e: any) => setInitAccount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">json metadata</div>
            <input
              type="text"
              value={json_metadata}
              onChange={(e: any) => setInitJsonMetadata(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">posting json metadata</div>
            <input
              type="text"
              value={posting_json_metadata}
              onChange={(e: any) => setInitPostingJson(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">extensions</div>
            <input
              type="text"
              value={extensions}
              onChange={(e: any) => setInitExtensions(e.target.value)}
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

export default AccountPosting;
