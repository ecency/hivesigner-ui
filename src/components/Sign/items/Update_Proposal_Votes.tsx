import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const UpdateProposalVote = () => {
  const [showTab, setShowTab] = useState(false);
  const [voter, setInitVoter] = useState("__signer");
  const [proposal_ids, setInitProposalIds] = useState("");
  const [approve, setInitApprove] = useState("true");
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
        <div className="Item_title">Update Proposal votes</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">voter</div>
            <input
              type="text"
              value={voter}
              onChange={(e: any) => setInitVoter(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">proposal ids</div>
            <input
              type="text"
              value={proposal_ids}
              onChange={(e: any) => setInitProposalIds(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">approve</div>
            <input
              type="text"
              value={approve}
              onChange={(e: any) => setInitApprove(e.target.value)}
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

export default UpdateProposalVote;
