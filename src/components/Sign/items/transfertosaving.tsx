import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const TransferToSaving = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_to_saving_from, setInitToSavingFrom] = useState("__signer");
  const [init_to_saving_to, setInitToSavingTo] = useState("__signer");
  const [init_to_saving_amount, setInitToSavingAmount] = useState("");
  const [init_to_saving_memo, setInitToSavingMemo] = useState("");

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
        <div className="Item_title">Transfer to saving</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">from</div>
            <input
              type="text"
              value={init_to_saving_from}
              onChange={(e: any) => setInitToSavingFrom(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">to</div>
            <input
              type="text"
              value={init_to_saving_to}
              onChange={(e: any) => setInitToSavingTo(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">amount</div>
            <input
              type="text"
              value={init_to_saving_amount}
              onChange={(e: any) => setInitToSavingAmount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">memo</div>
            <input
              type="text"
              value={init_to_saving_memo}
              onChange={(e: any) => setInitToSavingMemo(e.target.value)}
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

export default TransferToSaving;
