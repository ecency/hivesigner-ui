import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const CancelLimitOrder = () => {
  const [showTab, setShowTab] = useState(false);
  const [owner, setInitOwner] = useState("__signer");
  const [orderid, setInitOrderId] = useState("");
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
        <div className="Item_title">Cancel Limit Order</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">owner</div>
            <input
              type="text"
              value={owner}
              onChange={(e: any) => setInitOwner(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">orderid</div>
            <input
              type="text"
              value={orderid}
              onChange={(e: any) => setInitOrderId(e.target.value)}
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

export default CancelLimitOrder;
