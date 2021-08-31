import  React from "react"
import { useState, useEffect } from "react"
import { ethers } from "ethers";
import axios from "axios"
import { Loading } from "./Loading";

export function Gallery({URIs, provider, contract}) {
  const [tokenInfo, setTokenInfo] = useState([])
  const [loading, setLoading] = useState(false)
  const [signer, setSigner] = useState({})
  const [signerAddress, setSignerAddress] = useState('')


  useEffect(() => {
    const init = async () => {
      const tokenInfo = []
      for (const i in URIs) {
        const URI = URIs[i]
        let {data} = await axios.get(URI)
        const owner = await contract.ownerOf(i)
        const approved = await contract.getApproved(i)
        data = {owner, approved, ...data}
        console.log('data ',data)
        tokenInfo.push(data)
      }
      setTokenInfo(tokenInfo)
      setSigner(await provider.getSigner(0))
      setSignerAddress(signer.getAddress ? await signer.getAddress() : '')
    }
    init()    
  }, [URIs, loading])

  const onBuy = async (e, i, owner) => {
    setLoading(true);
    if (owner === signerAddress) {
      window.alert('You are already the owner')
      setLoading(false)
      return
    }

    try {
      const tx = await contract.connect(signer).buy(i)
      const receipt = await tx.wait()
      window.alert('You now own the NFT')
    } catch (error) {
      if (error.code === 4001)
        window.alert('User rejected transaction')
      console.error(error)
    }
    setLoading(false);
  }

  const onApprove = async (e, i) => {
    setLoading(true)
    const approved = await contract.getApproved(i)
    if (approved === contract.address) {
      window.alert('Already approved')
      setLoading(false)
      return
    }

    try {
      const tx = await contract.connect(signer).approve(contract.address, i)
      console.log(tx)
      const receipt = await tx.wait()
      window.alert('Approved')
    } catch (error) {
      if (error.code === 4001)
        window.alert('User rejected approval')
      console.error(error)
    }
    setLoading(false);
  }

  return (
    loading ? <Loading /> :
    <div className="container-fluid">
      <div className="px-lg-5">
        <div className="row">
          {
            tokenInfo.map( (itemInfo, i) => (
              <div key={i} className="col-xl-5 col-lg-5 col-md-6 mb-5" style={{
                margin: "4%"
              }}>
                <p>Owner <small style={{fontSize: 12}}>{itemInfo.owner}</small></p>
                <div className="bg-white rounded shadow-sm"><img src={itemInfo.image} alt="" className="img-fluid card-img-top" />
                  <div className="p-4">
                    <h5>{itemInfo.name}</h5>
                    <p className="small text-muted mb-0">{itemInfo.description}</p>
                    <div className="d-flex align-items-center justify-content-between rounded-pill bg-light px-3 py-2 mt-4">
                      {signerAddress === itemInfo.owner && ethers.constants.AddressZero === itemInfo.approved? 
                        <button className="btn btn-light" onClick={(e) => onApprove(e, i)}>Approve for sale</button> : 
                        <button className="btn btn-light" disabled>Approved for Sale</button> 
                      }
                      {
                        itemInfo.owner === signerAddress 
                        ? <button className="btn btn-light" disabled>You own this NFT</button>
                        : itemInfo.approved != ethers.constants.AddressZero ?
                          <button className="btn btn-light" onClick={(e) => onBuy(e, i, itemInfo.owner)}>Buy</button>
                          : <button className="btn btn-light" disabled>Item not approved for sale</button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>

  )
}

