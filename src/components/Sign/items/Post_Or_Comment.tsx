import React, { useState } from "react";
import { AiOutlineDown } from "react-icons/ai";
import "./items.scss";
const PostOrComment = () => {
  const [showTab, setShowTab] = useState(false);
  const [parent_author, setInitParentAuthor] = useState("");
  const [parent_permlink, setInitParentPermlink] = useState("");
  const [author, setInitAuthor] = useState("__signer");
  const [permlink, setInitPermlink] = useState("");
  const [title, setInitTitle] = useState("");
  const [body, setInitBody] = useState("");
  const [json_metadata, setInitJsonMetadata] = useState("");

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
        <div className="Item_title">Post or Comment</div>
      </div>
      {showTab && (
        <div className="ItemContent">
          <div className="form_control">
            <div className="label">parent_author</div>
            <input
              type="text"
              value={parent_author}
              onChange={(e: any) => setInitParentAuthor(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">parent_permlink</div>
            <input
              type="text"
              value={parent_permlink}
              onChange={(e: any) => setInitParentPermlink(e.target.value)}
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
            <div className="label">title</div>
            <input
              type="text"
              value={title}
              onChange={(e: any) => setInitTitle(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">body</div>
            <input
              type="text"
              value={body}
              onChange={(e: any) => setInitBody(e.target.value)}
            />
          </div>
          <div className="form_control">
            <div className="label">json_metadata</div>
            <input
              type="text"
              value={json_metadata}
              onChange={(e: any) => setInitJsonMetadata(e.target.value)}
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

export default PostOrComment;
