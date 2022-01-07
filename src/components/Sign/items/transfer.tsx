import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const Transfer = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_transfer_from, setInitTransferFrom] = useState("__signer");
  const [init_transfer_to, setInitTransferTo] = useState("");
  const [init_transfer_amount, setInitTransferAmount] = useState("");
  const [init_transfer_memo, setInitTransferMemo] = useState("");

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
        <div className="Item_title">Transfer</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">from</div>
            <input
              type="text"
              value={init_transfer_from}
              onChange={(e: any) => setInitTransferFrom(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">to</div>
            <input
              type="text"
              value={init_transfer_to}
              onChange={(e: any) => setInitTransferTo(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">amount</div>
            <input
              type="text"
              value={init_transfer_amount}
              onChange={(e: any) => setInitTransferAmount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">memo</div>
            <input
              type="text"
              value={init_transfer_memo}
              onChange={(e: any) => setInitTransferMemo(e.target.value)}
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

export default Transfer;
