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
  const [msgAdvice, setMsgAdvice] = useState("");

    /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);
  
  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0x4dEd994c792e3ABc4667aE794A125736E7bdF233";
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

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         * 
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        
        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object does not exist!");
      }
    }
    catch (error) {
      console.log(error);
    }
  };
  
  const handleChange = (e) => {
    try {
		  setMsgAdvice(e.currentTarget.value);
    }
    catch (error) {
      console.log(error);
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
        const waveTxn = await wavePortalContract.wave(msgAdvice);
        console.log("Message sent was: %s", msgAdvice);
        console.log("Mining...", waveTxn.hash);

        // while the transaction is being mined you can actually print out the transaction hash, copy/paste it to Etherscan, and see it being processed in real-time
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        // reset/empty the advice textbox
        setMsgAdvice("");
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
        Nice to see you at my wave portal! A bit about me: coding 💻 and hooping 🏀 are my passions. If you're a REAL one: connect your Ethereum wallet, type a friendly word of advice, and send me a wave!
        </div>
        <br/>
        <label>Your friendly message: </label>
        <input id="advice" name="advice" placeholder="Type a word of advice here" onChange={handleChange} value={msgAdvice} />
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

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
};

export default App;