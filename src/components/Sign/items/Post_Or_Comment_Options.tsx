import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const PostOrCommentOptions = () => {
  const [showTab, setShowTab] = useState(false);
  const [author, setInitAuthor] = useState("__signer");
  const [permlink, setInitPermlink] = useState("__signer");
  const [allow_curation_rewards, setInitCuration] = useState("true");
  const [allow_votes, setInitVotes] = useState("true");
  const [max_accepted_payout, setInitPayout] = useState("1000000.000 SBD");
  const [percent_hbd, setInitHbd] = useState("10000");
  const [extensions, setInitExtensions] = useState("__signer");
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
        <div className="Item_title">Post or comment options</div>
      </div>
      {showTab && (
        <div className="ItemContent">
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
            <div className="label">allow curation rewards</div>
            <input
              type="text"
              value={allow_curation_rewards}
              onChange={(e: any) => setInitCuration(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">allow votes</div>
            <input
              type="text"
              value={allow_votes}
              onChange={(e: any) => setInitVotes(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">max accepted payout</div>
            <input
              type="text"
              value={max_accepted_payout}
              onChange={(e: any) => setInitPayout(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">percent hbd</div>
            <input
              type="text"
              value={percent_hbd}
              onChange={(e: any) => setInitHbd(e.target.value)}
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

export default PostOrCommentOptions;
