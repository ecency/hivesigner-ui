import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const CreateProposal = () => {
  const [showTab, setShowTab] = useState(false);
  const [creator, setInitCreator] = useState("__signer");
  const [receiver, setInitReceiver] = useState("");
  const [start_date, setInitStartDate] = useState("");
  const [end_date, setInitEndDate] = useState("");
  const [daily_pay, setInitDailyPay] = useState("");
  const [subject, setInitSubject] = useState("");
  const [permlink, setInitPermlink] = useState("");
  const [extensions, setInitExtensions] = useState("");
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
        <div className="Item_title">Create Proposal</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">creator</div>
            <input
              type="text"
              value={creator}
              onChange={(e: any) => setInitCreator(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">receiver</div>
            <input
              type="text"
              value={receiver}
              onChange={(e: any) => setInitReceiver(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">start date</div>
            <input
              type="text"
              value={start_date}
              onChange={(e: any) => setInitStartDate(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">end date</div>
            <input
              type="text"
              value={end_date}
              onChange={(e: any) => setInitEndDate(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">daily pay</div>
            <input
              type="text"
              value={daily_pay}
              onChange={(e: any) => setInitDailyPay(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">subject</div>
            <input
              type="text"
              value={subject}
              onChange={(e: any) => setInitSubject(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">permlink</div>
            <input
              type="text"
              value={permlink}
              onChange={(e: any) => setInitPermlink(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">extensions</div>
            <input
              type="text"
              value={extensions}
              onChange={(e: any) => setInitExtensions(e.target.value)}
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

export default CreateProposal;
