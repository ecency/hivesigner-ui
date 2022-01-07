import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const WitnessProxy = () => {
  const [showTab, setShowTab] = useState(false);
  const [witness_proxy_account, setWitnessProxyAccount] = useState("__signer");
  const [witness_proxy, setWitnessProxy] = useState("");

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
        <div className="Item_title">Witness Proxy</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">account</div>
            <input
              type="text"
              value={witness_proxy_account}
              onChange={(e: any) => setWitnessProxyAccount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">proxy</div>
            <input
              type="text"
              value={witness_proxy}
              onChange={(e: any) => setWitnessProxy(e.target.value)}
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

export default WitnessProxy;
