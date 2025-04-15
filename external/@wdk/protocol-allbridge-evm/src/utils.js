const randomBytes = require('randombytes')

function getNonce () {
  return '0x' + randomBytes(32).toString('hex')
}

module.exports = {
  getNonce
}
