import  React from "react"
import { useState, useEffect } from "react"
import axios from "axios"

export function Gallery({URIs}) {
  const [tokenInfo, setTokenInfo] = useState([])

  useEffect(() => {
    const init = async () => {
      const tokenInfo = []
      for (const i in URIs) {
        const URI = URIs[i]
        const {data} = await axios.get(URI)
        console.log('data ',data)
        tokenInfo.push(data)
      }
      setTokenInfo(tokenInfo)
    }
    init()    
  }, [URIs])

  return (
    
    <div className="container-fluid">
      <div className="px-lg-5">
        <div className="row">
          {
            tokenInfo.map( (itmeInfo, i) => (
              <div className="col-xl-4 col-lg-4 col-md-6 mb-4">
                <div className="bg-white rounded shadow-sm"><img src={itmeInfo.image} alt="" className="img-fluid card-img-top" />
                  <div className="p-4">
                    <h5>{itmeInfo.name}</h5>
                    <p className="small text-muted mb-0">{itmeInfo.description}</p>
                    <div className="d-flex align-items-center justify-content-between rounded-pill bg-light px-3 py-2 mt-4">
                      <p className="small mb-0"><i className="fa fa-picture-o mr-2"></i><span className="font-weight-bold">JPG</span></p>
                      <div className="badge badge-danger px-3 rounded-pill font-weight-normal">New</div>
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

