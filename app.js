const { executeScript } = require('./runner')
let debugMode = false
let arg1 = process.argv[2]
if(arg1 === 'debug') {
  process.argv.unshift()
  debugMode = true
}
if(arg1 === '/?' || arg1 === '--help' || arg1 === '/help' || process.argv.length < 3) { require('./help') }
if(arg1.toUpperCase() === '--EVAL') {
  executeScript(process.argv[3].split('\\r\\n'), true)
} else if(arg1.toUpperCase() === "REPL") {
  require('./repl')(debugMode)
} else {
  const execFile = process.argv[2]
  const myLines = require('fs').readFileSync(execFile).toString().match(/^.+$/gm);
  executeScript(myLines, true, debugMode)
}

