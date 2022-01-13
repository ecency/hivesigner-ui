import React, { useState, useEffect } from "react";
import { ImMenu } from "react-icons/im";
import { AiOutlineClose } from "react-icons/ai";
import { BiSearch } from "react-icons/bi";
import Content from "../../layouts/content";
import Navbar from "../Index/Navbar";
import "./index.scss";
import HomeLogo from "../../assets/img/logo";
import { Link } from "react-router-dom";
import Transfer from "./items/transfer";
import Recurring from "./items/recurring";
import Delegate from "./items/delegate";
import PowerUp from "./items/power";
import Withdraw from "./items/withdraw";
import PowerDown from "./items/powerdown";
import TransferToSaving from "./items/transfertosaving";
import CancelTransfer from "./items/canceltransfer";
import Convert from "./items/convert";
import Collateralized from "./items/collateralized";
import WitnessVote from "./items/witnessvote";
import WitnessProxy from "./items/witnessproxy";
import Claim from "./items/Claim";
import CreateAccount from "./items/createaccount";
import LimitOrderOne from "./items/Limit_Order_One";
import LimitOrderTwo from "./items/Limit_Order_Two";
import CancelLimitOrder from "./items/Cancel_Limit_Order";
import RedeemRewards from "./items/Redeem_Rewards";
import PostOrComment from "./items/Post_Or_Comment";
import PostOrCommentOptions from "./items/Post_Or_Comment_Options";
import CustomOperation from "./items/Custom_Operation";
import DeleteComment from "./items/Delete_Comment";
import AccountActive from "./items/Update_Account_Active";
import AccountPosting from "./items/Update_Account_Posting";
import RecoveryAccount from "./items/Recovery_Account";
import CreateProposal from "./items/Create_Proposal";
import RemoveProposal from "./items/Remove_Proposal";
import UpdateProposalVote from "./items/Update_Proposal_Votes";
import UpdateProposal from "./items/Update_Proposal";
import Vote from "./items/vote";
const Index = () => {
  const [showNavbar, setshowNavbar] = useState(true);
  const [init_value, setInit_value] = useState("");
  const handleScreenChange = (mediaQuery: any) => {
    if (mediaQuery.matches) {
      setshowNavbar(true);
    } else {
      setshowNavbar(false);
    }
  };
  useEffect(() => {
    let window_width = window.matchMedia("(min-width:632px)");
    window_width.addListener(handleScreenChange);
    handleScreenChange(window_width);
    return () => {
      window_width.removeListener(handleScreenChange);
    };
  }, []);
  const handleChange = () => {
    setshowNavbar(!showNavbar);
  };
  const handleSearch = (e: any) => {
    setInit_value(e.target.value);
  };
  return (
    <Content>
      <div className="SignContainer">
        <div className="SignHeader">
          {/* <img src={HomeLogo} width="auto" height="auto" alt="logo" /> */}
          <div className="homelogo">
            <HomeLogo />
          </div>
          <div className="Title">
            <Link to="/">Sign transaction</Link>
          </div>
          <div className="SignMenubar" onClick={() => handleChange()}>
            {showNavbar ? <AiOutlineClose /> : <ImMenu />}
          </div>
        </div>
        <div>
          <div className="TransSearch">
            <BiSearch className="icon" />
            <input
              type="text"
              value={init_value}
              onChange={(e: any) => handleSearch(e)}
              placeholder="Search for apps"
            />
          </div>
          <div className="ResultContent">
            <Transfer />
            <Recurring />
            <Delegate />
            <PowerUp />
            <Withdraw />
            <PowerDown />
            <TransferToSaving />
            <CancelTransfer />
            <Convert />
            <Collateralized />
            <WitnessVote />
            <WitnessProxy />
            <Claim />
            <CreateAccount />
            <Vote />
            <LimitOrderOne />
            <LimitOrderTwo />
            <CancelLimitOrder />
            <RedeemRewards />
            <PostOrComment />
            <PostOrCommentOptions />
            <CustomOperation />
            <DeleteComment />
            <AccountActive />
            <AccountPosting />
            <RecoveryAccount />
            <CreateProposal />
            <RemoveProposal />
            <UpdateProposalVote />
            <UpdateProposal />
          </div>
        </div>
        <div className="Signfix">{showNavbar && <Navbar />}</div>
      </div>
    </Content>
  );
};

export default Index;
