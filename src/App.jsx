import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const getEthereumObject = () => window.ethereum;

/*
 * This function returns the first linked account found.
 * If there is no account linked, it will return null.
 */
const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();
    
    /*
    * First make sure we have access to the Ethereum object.
    */
    if (!ethereum) {
      console.log("Make sure you have metamask!");
    } 
    
    console.log("We have the ethereum object", ethereum);
    const accounts = await ethereum.request({method: "eth_accounts"});

    if (accounts.length != 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      return account;
    } else {
      console.error("No authorized account found!");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0x048f3eD92C2fD09B6350f915CdaB5b479B484323";
  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;
  
  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if(!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch(error) {
      console.error(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        // "ethers" is a library that helps our frontend talk to our contract. 
        // A "Provider" is what we use to actually talk to Ethereum nodes
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        
        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave();
        console.log("Mining...", waveTxn.hash);

        // while the transaction is being mined you can actually print out the transaction hash, copy/paste it to Etherscan, and see it being processed in real-time
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  /*
   * The passed callback function will be run when the page loads.
   * More technically, when the App component "mounts".
   */
  useEffect(async () => {
    const account = await findMetaMaskAccount(); 
    if (account !== null) {
      setCurrentAccount(account);
    }
  }, []);

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey Friend!
        </div>

        <div className="bio">
        I am Jordan and I am learning how to create and interact with Smart Contracts on the Ethereum blockchain! Connect your Ethereum wallet and share a wave, yeah?!
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
};

export default App;