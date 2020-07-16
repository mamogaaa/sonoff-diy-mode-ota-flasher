const sleep = require('sleep-promise')
const inquirer = require('inquirer')
const bonjour = require('bonjour')()
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const getIp = require('./get_ip')
const express = require('express')

const BIN_FILENAME = path.resolve(process.argv[2])
const BIN_FILE = fs.readFileSync(BIN_FILENAME)
const BIN_FILE_HASH = crypto.createHash('sha256').update(BIN_FILE).digest('hex')
console.log(BIN_FILENAME, BIN_FILE.length, BIN_FILE_HASH)
const SERVER_PORT = 8383

var devices = []

var browser = bonjour.find({
  type: 'ewelink'
}, (service) => devices.push(service))

let main = async () => {
  console.log('Looking for sonoff devices...')
  await sleep(1000)
  console.log(`${devices.length} devices found!`)
  console.log(devices)
  let { deviceName } = await inquirer.prompt([{
    type: 'list',
    name: 'deviceName',
    message: 'Select device',
    choices: devices.map(x => ({
      name: `${x.name} [${x.addresses.join(', ')}]`,
      value: x.name
    }))
  }])
  let device = devices.find(x => x.name == deviceName)
  let host = device.host
  let port = device.port
  console.log('Unlocking OTA...', `http://${host}:${port}/zeroconf/ota_unlock`)
  let res = await axios.post(`http://${host}:${port}/zeroconf/ota_unlock`, {
    deviceid: device.txt.id,
    data: {}
  })
  console.log('OTA has been unlocked!', res.data)
  
  // console.log(device, `http://${host}:${port}/zeroconf/ota_unlock`, res)

  const app = express()
  app.get('/firmware.bin', (req, res) => {
    res.sendFile(BIN_FILENAME)
  })
  app.listen(SERVER_PORT, (err) => {
    if (err) return console.error(`Can't listen!!`)
    console.log(`OTA server is listening on ${getIp(device.addresses[0])}:${SERVER_PORT}!!!`)
  })
  
  res = await axios.post(`http://${host}:${port}/zeroconf/ota_flash`, {
    deviceid: device.txt.id,
    data: {
      downloadUrl: `http://${getIp(device.addresses[0])}:${SERVER_PORT}/firmware.bin`,
      sha256sum: BIN_FILE_HASH
    }
  })
  console.log(res.data)
}

main()