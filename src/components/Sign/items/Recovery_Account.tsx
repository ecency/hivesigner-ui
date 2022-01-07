import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const RecoveryAccount = () => {
  const [showTab, setShowTab] = useState(false);
  const [account_to_recover, setInitAccountRecover] = useState("__signer");
  const [new_recovery_account, setInitNewAccountRecover] = useState("__signer");
  const [extensions, setInitextensions] = useState("__signer");

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
        <div className="Item_title">Change recovery account</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">account to recover</div>
            <input
              type="text"
              value={account_to_recover}
              onChange={(e: any) => setInitAccountRecover(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">new_recovery_account</div>
            <input
              type="text"
              value={new_recovery_account}
              onChange={(e: any) => setInitNewAccountRecover(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">extensions</div>
            <input
              type="text"
              value={extensions}
              onChange={(e: any) => setInitextensions(e.target.value)}
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

export default RecoveryAccount;
