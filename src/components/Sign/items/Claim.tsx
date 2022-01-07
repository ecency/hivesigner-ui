import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const Claim = () => {
  const [showTab, setShowTab] = useState(false);
  const [claim_creator, setInitClaimCreator] = useState("__signer");
  const [claim_fee, setInitClaimFee] = useState("0.000 HIVE");
  const [claim_extensions, setInitClaimExtensions] = useState("");

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
        <div className="Item_title">Claim account</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">creator</div>
            <input
              type="text"
              value={claim_creator}
              onChange={(e: any) => setInitClaimCreator(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">fee</div>
            <input
              type="text"
              value={claim_fee}
              onChange={(e: any) => setInitClaimFee(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">extensions</div>
            <input
              type="text"
              value={claim_extensions}
              onChange={(e: any) => setInitClaimExtensions(e.target.value)}
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

export default Claim;
