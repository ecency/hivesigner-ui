import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const RedeemRewards = () => {
  const [showTab, setShowTab] = useState(false);
  const [account, setInitAccount] = useState("__signer");
  const [reward_hive, setInitRewardHive] = useState("");
  const [reward_hbd, setInitRewardHbd] = useState("");
  const [reward_vests, setInitRewardVests] = useState("");

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
        <div className="Item_title">Redeem Rewards</div>
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
            <div className="label">reward_hive</div>
            <input
              type="text"
              value={reward_hive}
              onChange={(e: any) => setInitRewardHive(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">reward_hbd</div>
            <input
              type="text"
              value={reward_hbd}
              onChange={(e: any) => setInitRewardHbd(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">reward_vests</div>
            <input
              type="text"
              value={reward_vests}
              onChange={(e: any) => setInitRewardVests(e.target.value)}
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

export default RedeemRewards;
