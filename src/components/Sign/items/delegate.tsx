import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const Delegate = () => {
  const [showTab, setShowTab] = useState(false);

  const [init_delegate_delegator, setInitDelegateDelegator] =
    useState("__signer");
  const [init_delegate_delegatee, setInitDelegateDelegatee] = useState("");
  const [init_delegate_vesting, setInitDelegateVesting] = useState("");
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
        <div className="Item_title">Delegate Hive Power</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">delegator</div>
            <input
              type="text"
              value={init_delegate_delegator}
              onChange={(e: any) => setInitDelegateDelegator(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">delegatee</div>
            <input
              type="text"
              value={init_delegate_delegatee}
              onChange={(e: any) => setInitDelegateDelegatee(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">vesting_shares</div>
            <input
              type="text"
              value={init_delegate_vesting}
              onChange={(e: any) => setInitDelegateVesting(e.target.value)}
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

export default Delegate;
