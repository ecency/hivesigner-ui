import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const AccountActive = () => {
  const [showTab, setShowTab] = useState(false);
  const [account, setInitAccount] = useState("__signer");
  const [owner, setInitOwner] = useState("");
  const [active, setInitActive] = useState("");
  const [posting, setInitPosting] = useState("");
  const [memo_key, setInitMemoKey] = useState("");
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
        <div className="Item_title">Update account(active)</div>
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
            <div className="label">owner</div>
            <input
              type="text"
              value={owner}
              onChange={(e: any) => setInitOwner(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">active</div>
            <input
              type="text"
              value={active}
              onChange={(e: any) => setInitActive(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">posting</div>
            <input
              type="text"
              value={posting}
              onChange={(e: any) => setInitPosting(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">memo key</div>
            <input
              type="text"
              value={memo_key}
              onChange={(e: any) => setInitMemoKey(e.target.value)}
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
            <button onClick={() => handleSign()}>Sign</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountActive;
