import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const PowerUp = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_powerup_from, setInitPowerupFrom] = useState("__signer");
  const [init_powerup_to, setInitPowerupTo] = useState("__signer");
  const [init_powerup_amount, setInitPowerupAmount] = useState("");

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
        <div className="Item_title">Power up</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">from</div>
            <input
              type="text"
              value={init_powerup_from}
              onChange={(e: any) => setInitPowerupFrom(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">to</div>
            <input
              type="text"
              value={init_powerup_to}
              onChange={(e: any) => setInitPowerupTo(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">amount</div>
            <input
              type="text"
              value={init_powerup_amount}
              onChange={(e: any) => setInitPowerupAmount(e.target.value)}
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

export default PowerUp;
