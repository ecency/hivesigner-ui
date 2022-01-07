import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const CreateAccount = () => {
  const [showTab, setShowTab] = useState(false);
  const [creator, setInitCreator] = useState("__signer");
  const [fee, setInitFee] = useState("3.000 HIVE");
  const [new_acc_name, setInitNewAccName] = useState("");
  const [memo_key, setInitMemoKey] = useState("");
  const [json_metadata, setInitJsonMetadata] = useState("");
  const [owner, setInitOwner] = useState("");
  const [active, setInitActive] = useState("");
  const [posting, setInitPosting] = useState("");
  const [extensions, setInitExtensions] = useState("");
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
        <div className="Item_title">Create account</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">creator</div>
            <input
              type="text"
              value={creator}
              onChange={(e: any) => setInitCreator(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">fee</div>
            <input
              type="text"
              value={fee}
              onChange={(e: any) => setInitFee(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">new_account_name</div>
            <input
              type="text"
              value={new_acc_name}
              onChange={(e: any) => setInitNewAccName(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">memo_key</div>
            <input
              type="text"
              value={memo_key}
              onChange={(e: any) => setInitMemoKey(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">json_metadata</div>
            <input
              type="text"
              value={json_metadata}
              onChange={(e: any) => setInitJsonMetadata(e.target.value)}
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

export default CreateAccount;
