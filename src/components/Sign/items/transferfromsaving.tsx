import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const TransferFromSaving = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_from_saving_from, setInitFromSavingFrom] = useState("__signer");
  const [init_from_saving_to, setInitFromSavingTo] = useState("__signer");
  const [init_from_saving_amount, setInitFromSavingAmount] = useState("");
  const [init_from_saving_memo, setInitFromSavingMemo] = useState("");
  const [init_from_saving_request_id, setInitFromSavingRequestId] =
    useState("");
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
        <div className="Item_title">Transfer from saving</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">from</div>
            <input
              type="text"
              value={init_from_saving_from}
              onChange={(e: any) => setInitFromSavingFrom(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">to</div>
            <input
              type="text"
              value={init_from_saving_to}
              onChange={(e: any) => setInitFromSavingTo(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">amount</div>
            <input
              type="text"
              value={init_from_saving_amount}
              onChange={(e: any) => setInitFromSavingAmount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">memo</div>
            <input
              type="text"
              value={init_from_saving_memo}
              onChange={(e: any) => setInitFromSavingMemo(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">request_id</div>
            <input
              type="text"
              value={init_from_saving_request_id}
              onChange={(e: any) => setInitFromSavingRequestId(e.target.value)}
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

export default TransferFromSaving;
