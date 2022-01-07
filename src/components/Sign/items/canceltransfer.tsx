import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const CancelTransfer = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_cancel_from, setInitCancelFrom] = useState("__signer");
  const [init_cancel_request_id, setInitCancelRequestId] = useState("");

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
        <div className="Item_title">Cancel transfer from saving</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">from</div>
            <input
              type="text"
              value={init_cancel_from}
              onChange={(e: any) => setInitCancelFrom(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">request_id</div>
            <input
              type="text"
              value={init_cancel_request_id}
              onChange={(e: any) => setInitCancelRequestId(e.target.value)}
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

export default CancelTransfer;
