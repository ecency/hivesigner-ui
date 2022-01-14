import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const DeleteComment = () => {
  const [showTab, setShowTab] = useState(false);
  const [author, setInitauthor] = useState("__signer");
  const [permlink, setInitPermlink] = useState("");
  const handleShow = () => {
    setShowTab(!showTab);
  };
  return (
    <div className="Item">
      <div className="ItemHeader" id="transfer" onClick={() => handleShow()}>
        {showTab ? (
          <AiOutlineDown className="Item_icon" />
        ) : (
          <AiOutlineDown className="Item_icon_rotate" />
        )}
        <div className="Item_title">Delete Comment</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">author</div>
            <input
              type="text"
              value={author}
              onChange={(e: any) => setInitauthor(e.target.value)}
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
            <button onClick={() => alert("sign")}>Sign</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteComment;
