import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const Collateralized = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_collateralized_owner, setInitCollateralizedOwner] =
    useState("__signer");
  const [init_collateralized_request_id, setInitCollateralizedRequestId] =
    useState("");
  const [init_collateralized_amount, setInitCollateralizedAmount] =
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
        <div className="Item_title">Collateralized Convert</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">owner</div>
            <input
              type="text"
              value={init_collateralized_owner}
              onChange={(e: any) => setInitCollateralizedOwner(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">requestid</div>
            <input
              type="text"
              value={init_collateralized_request_id}
              onChange={(e: any) =>
                setInitCollateralizedRequestId(e.target.value)
              }
            />
          </div>
          <div className="form_control">
            <div className="label">amount</div>
            <input
              type="text"
              value={init_collateralized_amount}
              onChange={(e: any) => setInitCollateralizedAmount(e.target.value)}
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

export default Collateralized;
