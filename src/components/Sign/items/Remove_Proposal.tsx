import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const RemoveProposal = () => {
  const [showTab, setShowTab] = useState(false);
  const [proposal_owner, setInitProposalOwner] = useState("__signer");
  const [proposal_ids, setInitProposalIds] = useState("");
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
        <div className="Item_title">Remove Proposal</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">proposal owner</div>
            <input
              type="text"
              value={proposal_owner}
              onChange={(e: any) => setInitProposalOwner(e.target.value)}
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

export default RemoveProposal;
