import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const PowerDown = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_powerdown_account, setInitPowerdownAccount] =
    useState("__signer");
  const [init_powerdown_vesting_shares, setInitVestinShares] = useState("");

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
        <div className="Item_title">Power up</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">account</div>
            <input
              type="text"
              value={init_powerdown_account}
              onChange={(e: any) => setInitPowerdownAccount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">vesting_shares</div>
            <input
              type="text"
              value={init_powerdown_vesting_shares}
              onChange={(e: any) => setInitVestinShares(e.target.value)}
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

export default PowerDown;
