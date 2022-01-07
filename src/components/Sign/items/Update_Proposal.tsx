import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const UpdateProposal = () => {
  const [showTab, setShowTab] = useState(false);
  const [creator, setInitCreator] = useState("__signer");
  const [proposal_id, setInitProposalId] = useState("");
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
        <div className="Item_title">Update Proposal</div>
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
            <div className="label">proposal id</div>
            <input
              type="text"
              value={proposal_id}
              onChange={(e: any) => setInitProposalId(e.target.value)}
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

export default UpdateProposal;
