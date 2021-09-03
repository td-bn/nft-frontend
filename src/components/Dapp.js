import React from "react";

import { ethers } from "ethers";
import identicon from 'identicon';
import {create} from 'ipfs-http-client';
import crypto from 'crypto';

import contractAddress from "../contracts/contract-address.json";
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";
import { Gallery } from "./Gallery";
import { mnemonicToEntropy } from "ethers/lib/utils";
import NFT from "../contracts/INFT.json";

const client = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
const NETWORK_ID = '4';
// const NETWORK_ID = '31337';

const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // The info of the contract
      tokenData: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      tokenURIs: [],
      loading: false,
    };

    this.state = this.initialState;
  }

  async mintToken(e) {
    console.log('Minting')
    this.setState({loading: true})

    const id = crypto.randomBytes(20).toString('hex')
    const buffer = identicon.generateSync({ id: id , size: 400 })

    const data = buffer.replace(/^data:image\/\w+;base64,/, "")
    const buf = Buffer.from(data, 'base64');

    const img = await client.add(buf, { cidVersion: 1})
    const imgCID = img.cid.toString()

    const metaData = {
      name: id,
      description: 'Randomly generated identicon',
      image: `ipfs://${imgCID}`,
      imageGateway: `https://ipfs.io/ipfs/${imgCID}`
    }

    const meta = await client.add(JSON.stringify(metaData), { cidVersion: 1})
    const metaCID = meta.cid.toString()
    
    console.log(this._signer)
    const signerAddress = await this._signer.getAddress()
    try {
      const tx = await this._token.mint(signerAddress, metaCID)
      const res = await tx.wait()
      this.setState({tokenURIs: [...this.state.tokenURIs, metaCID]})
    } catch (error) {
      console.error(error)
    }
    this.setState({loading: false})
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      this._connectWallet();
      return (
        <ConnectWallet 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (!this.state.tokenData || this.state.loading) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              {this.state.tokenData.name} ({this.state.tokenData.symbol})
            </h1>
            <div className="clearfix">
              <p className="float-left">Welcome <b>{this.state.selectedAddress}</b></p>
              <button className="btn btn-primary float-right" onClick={(e) => this.mintToken(e)}>Mint</button>
            </div>
           
          </div>
        </div>

        <div id="generated"></div>

        <hr />
        <Gallery URIs={this.state.tokenURIs} provider={this._provider} contract={this._token} />
      </div>
    );
  }

  componentWillUnmount() {
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.enable();

    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
    
    // We reset the dapp state if the network is changed
    window.ethereum.on("networkChanged", ([networkId]) => {
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize ethers, fetch the contract data
    this._intializeEthers();
    this._getTokenData();
    this._updateURIs();
  }

  async _intializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    this._signer = this._provider.getSigner(0)

    // When, we initialize the contract using that provider and the token's
    // artifact. 
    this._token = new ethers.Contract(
      contractAddress.AnimalNFT,
      NFT.abi,
      this._signer
    );
  }

  // The next two methods just read from the contract and store the results
  // in the component state.
  async _getTokenData() {
    try {
      const name = await this._token.name();
      const symbol = await this._token.symbol();

      this.setState({ tokenData: { name, symbol } });
    } catch (error) {
      console.log(error)  
    }
  }

  async _updateURIs() {
    const tokenURIs = [];
    const n = await this._token.nextTokenId();
    for (let i=0; i<n; i++)
      tokenURIs.push(await this._token.tokenURI(i))
    this.setState({ tokenURIs });
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545 
  _checkNetwork() {
    if (window.ethereum.networkVersion === NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to correct network'
    });

    return false;
  }
}
