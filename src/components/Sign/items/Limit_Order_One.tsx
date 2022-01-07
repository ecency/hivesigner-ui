import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const LimitOrderOne = () => {
  const [showTab, setShowTab] = useState(false);
  const [owner, setInitOwner] = useState("__signer");
  const [orderid, setInitOrderId] = useState("");
  const [amount_to_sell, setInitAmountToSell] = useState("");
  const [min_to_receive, setInitMinToReceive] = useState("");
  const [fill_or_kill, setInitFillOrKill] = useState("");
  const [expiration, setInitExpiration] = useState("");

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
        <div className="Item_title">Create Limit Order</div>
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
            <div className="label">amount_to_sell</div>
            <input
              type="text"
              value={amount_to_sell}
              onChange={(e: any) => setInitAmountToSell(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">min_to_receive</div>
            <input
              type="text"
              value={min_to_receive}
              onChange={(e: any) => setInitMinToReceive(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">fill_or_kill</div>
            <input
              type="text"
              value={fill_or_kill}
              onChange={(e: any) => setInitFillOrKill(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">expiration</div>
            <input
              type="text"
              value={expiration}
              onChange={(e: any) => setInitExpiration(e.target.value)}
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

export default LimitOrderOne;
