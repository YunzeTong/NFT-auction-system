let data = require('./bid.json')
let web3 = require('./initWeb3')


let abi = data.abi
let address = '0x7e150E2FE8d71c0Bc65dBFDb86ddF0A9aB6c9111'
let contract = new web3.eth.Contract(abi, address)
module.exports = contract