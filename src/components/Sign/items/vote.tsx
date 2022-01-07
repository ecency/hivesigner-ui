import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const Vote = () => {
  const [showTab, setShowTab] = useState(false);
  const [voter, setInitVoter] = useState("__signer");
  const [author, setInitAuthor] = useState("");
  const [permlink, setInitPermlink] = useState("");
  const [weight, setInitWeight] = useState("10000");

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
        <div className="Item_title">Vote</div>
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
            <div className="label">author</div>
            <input
              type="text"
              value={author}
              onChange={(e: any) => setInitAuthor(e.target.value)}
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
            <div className="label">weight</div>
            <input
              type="text"
              value={weight}
              onChange={(e: any) => setInitWeight(e.target.value)}
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

export default Vote;
