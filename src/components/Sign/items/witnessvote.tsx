import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const WitnessVote = () => {
  const [showTab, setShowTab] = useState(false);
  const [witness_vote_account, setWitnessVoteAccount] = useState("__signer");
  const [witness_vote_witness, setWitnessVoteWitness] = useState("");
  const [witness_vote_approve, setWitnessVoteApprove] = useState("true");

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
        <div className="Item_title">Witness Vote</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">account</div>
            <input
              type="text"
              value={witness_vote_account}
              onChange={(e: any) => setWitnessVoteAccount(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">witness</div>
            <input
              type="text"
              value={witness_vote_witness}
              onChange={(e: any) => setWitnessVoteWitness(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">approve</div>
            <input
              type="text"
              value={witness_vote_approve}
              onChange={(e: any) => setWitnessVoteApprove(e.target.value)}
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

export default WitnessVote;
