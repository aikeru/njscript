const fs = require('fs')
const path = require('path')
let config = {loaded: false}

const paths = [
  path.join(process.env.HOME, '.njsrc'),
  path.join(process.env.HOME, '_njsrc'),
  path.join(process.cwd(), '.njsrc'),
  path.join(process.cwd(), '_njsrc'),
  path.join('./', '.njsrc'),
  path.join('./', '_njsrc')
]

const foundPath = paths.find(p => fs.existsSync(p))
if(foundPath) {
  try {
    config = require(foundPath)
  } catch(e) {
    console.log('Failed to load config!')
    throw e
  }
}

module.exports = config