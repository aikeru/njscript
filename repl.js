const { executeScript } = require('./runner')
async function replExec(debugMode) {
  const repl = require('repl')
  let replInstance;
  const config = require('./config')
  let prompt;
  if (config.prompt) {
    try {
      prompt = await config.prompt({executeScript})
    } catch (e) {
      prompt = 'error >'
    }
  }

  async function myEval(cmd, context, filename, callback) {
    let isHandled = false
    if(config.onReceiveCommand) {
      isHandled = await config.onReceiveCommand(cmd.replace(/(\r\n|\r|\n)/g, ""), context, filename, callback)
    }
    if(!isHandled) { await executeScript([cmd], false, debugMode) }
    if (config.prompt) {
      try {
        const newPrompt = await config.prompt({executeScript})
        replInstance.setPrompt(newPrompt)
      } catch (e) {
        replInstance.setPrompt('error >')
      }
    }
    replInstance.displayPrompt(true)
    callback(null)
  }

  console.log('Starting NJS REPL')
  let buffer = ''
  process.stdin.on('data', function (chunk) {
    buffer += chunk.toString('utf8')
  })
  replInstance = repl.start({
    prompt,
    eval: myEval,
    input: process.stdin,
    output: process.stdout,
  })
}

module.exports = replExec

