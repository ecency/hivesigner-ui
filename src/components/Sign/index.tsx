import React, { useState, useEffect } from "react";
import { ImMenu } from "react-icons/im";
import { AiOutlineClose } from "react-icons/ai";
import { BiSearch } from "react-icons/bi";
import Content from "../../layouts/content";
import Navbar from "../Index/Navbar";
import "./index.scss";
import HomeLogo from "../../assets/img/logo";
import Transfer from "./items/transfer";
import Recurring from "./items/recurring";
import Delegate from "./items/delegate";
import PowerUp from "./items/power";
import Withdraw from "./items/withdraw";
import PowerDown from "./items/powerdown";
import TransferToSaving from "./items/transfertosaving";
import TransferFromSaving from "./items/transferfromsaving";
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
const listArr = [
  { key: 'transfer', value: <Transfer /> },
  { key: 'recurring transfers', value: <Recurring /> },
  { key: 'delegate hive power', value: <Delegate /> },
  { key: 'power up', value: <PowerUp /> },
  { key: 'set withdraw vesting route', value: <Withdraw /> },
  { key: 'powerdown', value: <PowerDown /> },
  { key: 'transfer to saving', value: <TransferToSaving /> },
  { key: 'transfer from saving', value: <TransferFromSaving /> },
  { key: 'cancel transfer from saving', value: <CancelTransfer /> },
  { key: 'convert', value: <Convert /> },
  { key: 'collateralized convert', value: <Collateralized /> },
  { key: 'witness vote', value: <WitnessVote /> },
  { key: 'witness proxy', value: <WitnessProxy /> },
  { key: 'claim account', value: <Claim /> },
  { key: 'create account', value: <CreateAccount /> },
  { key: 'vote', value: <Vote /> },
  { key: 'create limit order', value: <LimitOrderOne /> },
  { key: 'create limit order', value: <LimitOrderTwo /> },
  { key: 'cancel limit order', value: <CancelLimitOrder /> },
  { key: 'redeem rewards', value: <RedeemRewards /> },
  { key: 'post or comment', value: <PostOrComment /> },
  { key: 'post or comment options', value: <PostOrCommentOptions /> },
  { key: 'custom operation', value: <CustomOperation /> },
  { key: 'delete comment', value: <DeleteComment /> },
  { key: 'update account (active)', value: <AccountActive /> },
  { key: 'update account (posting)', value: <AccountPosting /> },
  { key: 'vhange recovery account', value: <RecoveryAccount /> },
  { key: 'vreate Proposal', value: <CreateProposal /> },
  { key: 'remove Proposal', value: <RemoveProposal /> },
  { key: 'update proposal votes', value: <UpdateProposalVote /> },
  { key: 'update proposal', value: <UpdateProposal /> },

];
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
            <a href="#">Sign transaction</a>
          </div>
          <div className="SignMenubar" onClick={() => handleChange()}>
            {showNavbar ? <AiOutlineClose /> : <ImMenu />}
          </div>
        </div>
        <div>
          <div className="TransSearch">
            <input
              type="text"
              className="SignInput"
              value={init_value}
              onChange={(e: any) => handleSearch(e)}
              placeholder="Please type name of transaction that need to sign"
            />
            <BiSearch className="icon" />
          </div>
          <div className="ResultContent">
            {!init_value && listArr.map((v, k) => v.value)}
            {init_value && listArr.filter((v, k) => v.key.includes(init_value.toLowerCase())).map((v1, k1) => v1.value)}
          </div>
        </div>
      </div>
      <div className="Signfix">{showNavbar && <Navbar />}</div>
    </Content>
  );
};

export default Index;
