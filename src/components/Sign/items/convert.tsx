import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const Convert = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_convert_owner, setInitConvertOwner] = useState("__signer");
  const [init_convert_request_id, setInitConvertRequestId] = useState("");
  const [init_convert_amount, setInitConvertAmount] = useState("");

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
        <div className="Item_title">Convert</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">owner</div>
            <input
              type="text"
              value={init_convert_owner}
              onChange={(e: any) => setInitConvertOwner(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">requestid</div>
            <input
              type="text"
              value={init_convert_request_id}
              onChange={(e: any) => setInitConvertRequestId(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">amount</div>
            <input
              type="text"
              value={init_convert_amount}
              onChange={(e: any) => setInitConvertAmount(e.target.value)}
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

export default Convert;
