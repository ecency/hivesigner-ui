import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const Recurring = () => {
  const [showTab, setShowTab] = useState(false);
  const [init_recurring_from, setInitRecurringFrom] = useState("__signer");
  const [init_recurring_to, setInitRecurringTo] = useState("");
  const [init_recurring_amount, setInitRecurringAmount] = useState("");
  const [init_recurring_memo, setInitRecurringMemo] = useState("");
  const [init_recurring_recurrence, setInitRecurringRecurrence] = useState("");
  const [init_recurring_executions, setInitRecurringExecutions] = useState("");
  const [init_recurring_extensions, setInitRecurringExtensions] = useState("");

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
        <div className="Item_title">Recurring Transfers</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">from</div>
            <input
              type="text"
              value={init_recurring_from}
              onChange={(e: any) => setInitRecurringFrom(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">to</div>
            <input
              type="text"
              value={init_recurring_to}
              onChange={(e: any) => setInitRecurringTo(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">amount</div>
            <input
              type="text"
              value={init_recurring_amount}
              onChange={(e: any) => setInitRecurringAmount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">memo</div>
            <input
              type="text"
              value={init_recurring_memo}
              onChange={(e: any) => setInitRecurringMemo(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">recurrence</div>
            <input
              type="text"
              value={init_recurring_recurrence}
              onChange={(e: any) => setInitRecurringRecurrence(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">executions</div>
            <input
              type="text"
              value={init_recurring_executions}
              onChange={(e: any) => setInitRecurringExecutions(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">extensions</div>
            <input
              type="text"
              value={init_recurring_extensions}
              onChange={(e: any) => setInitRecurringExtensions(e.target.value)}
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

export default Recurring;
