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
  const contractAddress = "0xaf5641e287aAd6cb92bB5586a372Af560D20EF1A";
  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;
  
  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if(!ethereum) {
        alert("The MetaMask browser extension is required in order to connect!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected ", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWaves();
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

        // listen for new waves
        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });
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
        * "gaslimit" set here makes the user pay a set amount of gas of 1,000,000. And, if they don't use all of it in the transaction they'll automatically be refunded
        */
        const waveTxn = await wavePortalContract.wave(msgAdvice, { gasLimit: 1000000 });
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

    getAllWaves();
  }, []);

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey Friend!
        </div>

        <div className="bio">
        Nice to see you at my wave portal! A bit about me: coding 💻 and hooping 🏀 are my passions. I enjoy interacting and learning from others, so I'd love to hear from you! Feel free to interact with me by connecting your Ethereum wallet, type me your favorite quote or word of advice (about anything!), and then click to wave at me with this message!
        </div>
        <br/>
        <label>Your friendly message: </label>
        <input id="advice" name="advice" placeholder="Type a word of advice here" onChange={handleChange} value={msgAdvice} />
        <button className="waveButton" onClick={wave}>
          Wave At Me
        </button>

        {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {currentAccount && (
          <div id="parent">
            
        <br />
        <br />
        <div className="header">
        Wave Sender History
        </div>
        {allWaves?.length > 0 && 
          allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}

        {allWaves?.length === 0 && 
          <div>No Waves Exist!</div>
        }
            
          </div>
        )}
      </div>
    </div>
  );
};

export default App;