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
        data = {owner, ...data}
        console.log('data ',data)
        tokenInfo.push(data)
      }
      setTokenInfo(tokenInfo)
      setSigner(await provider.getSigner(0))
      setSignerAddress(signer.getAddress ? await signer.getAddress() : '')
    }
    init()    
  }, [URIs])

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
    } catch (error) {
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
      const receipt = await tx.wait()
    } catch (error) {
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
            tokenInfo.map( (itmeInfo, i) => (
              <div key={i} className="col-xl-5 col-lg-5 col-md-6 mb-5" style={{
                margin: "4%"
              }}>
                <p>Owner <small style={{fontSize: 12}}>{itmeInfo.owner}</small></p>
                <div className="bg-white rounded shadow-sm"><img src={itmeInfo.image} alt="" className="img-fluid card-img-top" />
                  <div className="p-4">
                    <h5>{itmeInfo.name}</h5>
                    <p className="small text-muted mb-0">{itmeInfo.description}</p>
                    <div className="d-flex align-items-center justify-content-between rounded-pill bg-light px-3 py-2 mt-4">
                      {signerAddress === itmeInfo.owner ? 
                        <button className="btn btn-light" onClick={(e) => onApprove(e, i)}>Approve for sale</button> : ''
                      }
                      <button className="btn btn-light" onClick={(e) => onBuy(e, i, itmeInfo.owner)}>Buy</button>
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

