import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const Withdraw = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_withdraw_from_account, setInitWithdrawFromAccount] =
    useState("__signer");
  const [init_withdraw_to_acount, setInitWithdrawpToAccount] = useState("");
  const [init_withdraw_percent, setInitWithdrawPercent] = useState("");
  const [init_withdraw_auto_vest, setInitWithdrawAmount] = useState("false");
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
        <div className="Item_title">Set withdraw vesting route</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">from_account</div>
            <input
              type="text"
              value={init_withdraw_from_account}
              onChange={(e: any) => setInitWithdrawFromAccount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">to_account</div>
            <input
              type="text"
              value={init_withdraw_to_acount}
              onChange={(e: any) => setInitWithdrawpToAccount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">percent</div>
            <input
              type="text"
              value={init_withdraw_percent}
              onChange={(e: any) => setInitWithdrawPercent(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">auto_vest</div>
            <input
              type="text"
              value={init_withdraw_auto_vest}
              onChange={(e: any) => setInitWithdrawAmount(e.target.value)}
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

export default Withdraw;
