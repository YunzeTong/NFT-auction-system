let Web3 = require('web3')

let web3 = new Web3()
if (window.ethereum) {
    web3 = new Web3(window.ethereum)
} else if (window.web3){
    web3 = new Web3(Web3.givenProvider || "http://localhost:8545")       //这块是不是window.web3.current?
} else {
    alert('需要先安装MetaMask')
}


window.ethereum.enable()
module.exports = web3