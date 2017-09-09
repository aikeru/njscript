// const {spawn} = require('child_process')
const spawn = require('cross-spawn')
const temp = require('temp')
const fs = require('fs')
require('winax')
let originalEdge = null
let edgeError = null
try {
  originalEdge = require('edge')
} catch (e) {
  edgeError = e
}
temp.track()
const commands = require('./syscommands')
let debugMode = false
const messages = []
const log = (str) => {
  messages.push(str)
  // debugMode && console.log(str)
}

const quit = (exitCode) => process.exit(exitCode)

async function executeScript(myLines, exitAfter, shouldDebug, silentMode = false) {
  if(shouldDebug) { debugMode = true }
  const lastCommand = {
    output: '',
    errorLevel: 0
  }

  let echoCommands = false
  let currentCommands = []
  let scriptMode = false

  const processed = myLines.map((line) => {
    log('Parsing:[' + line + ']')
    const lineNoWS = line.replace('\r\n', '').replace('\r', '').replace('\n', '')
    if (scriptMode === false && (lineNoWS.toLowerCase().startsWith('//runscript')
        || lineNoWS.toLowerCase().startsWith('/*runscript') )) {
      scriptMode = true
      log('code-runscript:await __spawnScript(`')
      return 'await __spawnScript(`'
    }
    if (scriptMode === true) {
      if (lineNoWS.toLowerCase().startsWith('//end')
        || lineNoWS.toLowerCase().startsWith('end*/')) {
        scriptMode = false
        log('code-endscript:`)')
        return '`)'
      } else {
        currentCommands.push(lineNoWS)
        log('code-continuescript:')
        return ''
      }
    }
    const exitCommands = ['QUIT', 'EXIT']
    if (exitCommands.some(ec => ec === lineNoWS.toUpperCase())) {
      log('command:quit()')
      quit()
      return
    }
    if (lineNoWS.toUpperCase() === "CD" || lineNoWS.toUpperCase() === 'PWD') {
      log('command:cd')
      if(!silentMode) { console.log(process.cwd()) }
      lastCommand.output = process.cwd()
      lastCommand.errorLevel = 0
      return
    }
    if(lineNoWS.toUpperCase().startsWith('WHICH')) {
      log('command:which')
      const remainder = lineNoWS.split(' ').slice(1).join(' ')
      const execCmd = 'await __spawnCommand(`WHERE ' + remainder + '`)'
      return execCmd
    }
    if (lineNoWS.toUpperCase().startsWith('TOUCH')) {
      log('command:touch')
      const remainder = lineNoWS.split(' ').slice(1).join(' ')
      const execCmd = 'await __spawnCommand(`IF NOT EXIST "' + remainder + '" ECHO.>"' + remainder + '"`)'
      return execCmd
    }
    if (lineNoWS.toUpperCase().startsWith('RM')) {
      log('command:rm')
      const remainder = lineNoWS.split(' ').slice(1).join(' ')
      const execCmd = 'await __spawnCommand(`del "' + remainder.replace(/\//g, "\\") + '"`)'
      return execCmd
    }
    if (lineNoWS.toUpperCase().startsWith('LS')) {
      log('code-ls:await __spawnCommand(`dir`)')
      return 'await __spawnCommand(`dir`)'
    }
    if (lineNoWS.toUpperCase().startsWith('CAT')) {
      log('code-cat:await __spawmCommand(`' + lineNoWS.replace(/^cat/gi, 'type') + '`)')
      return 'await __spawnCommand(`' + lineNoWS.replace(/^cat/gi, 'type') + '`)'
    }
    if (lineNoWS.toUpperCase().startsWith('!')) {
      log('code-!:await __spawnCommand(`' + lineNoWS.slice(1) + '`)')
      return 'await __spawnCommand(`' + lineNoWS.slice(1) + '`)'
    }
    if (lineNoWS.startsWith("IF") || lineNoWS.startsWith("If") || lineNoWS.startsWith("iF")
      || (lineNoWS.startsWith("if") && !lineNoWS.startsWith("if ("))) {
      log('code-if:await __spawnCommand(`' + lineNoWS + '`)')
      return 'await __spawnCommand(`' + lineNoWS + '`)'
    } else if (lineNoWS.startsWith('if')) {
      log('code-if2:' + line)
      return line
    }
    if (lineNoWS.substring(0, 3) === "for"
      && (lineNoWS.toLowerCase().startsWith("for (") || lineNoWS.toLowerCase().startsWith("for("))) {
      log('code-for:' + line)
      return line
    } else if (lineNoWS.toLowerCase().startsWith("for")) {
      log('code-for2:await __spawnCommand(`' + lineNoWS + '`)')
      return 'await __spawnCommand(`' + lineNoWS + '`)'
    }
    if (lineNoWS.toUpperCase().startsWith('CD ')
      || lineNoWS.toUpperCase().startsWith('CD..')) {
      const execCmd = 'await __spawnScript(`@echo off\r\n' + lineNoWS + '\r\nECHO %CD%`, true)'
        + '.then(() => process.chdir(lastCommand.output.replace(`\\r`, ``).replace(`\\n`,``)))'
      log('code-cd:' + execCmd)
      return execCmd
      // process.chdir('')
    }
    if (lineNoWS.toUpperCase().startsWith('@ECHO ON')
      || lineNoWS.toUpperCase().startsWith('ECHO ON')) {
      log('command:echo on')
      echoCommands = true
      return
    }
    if (lineNoWS.toUpperCase().startsWith('@ECHO OFF')
      || lineNoWS.toUpperCase().startsWith('ECHO OFF')) {
      log('command:echo off')
      echoCommands = false
      return
    }
    if (commands.some(c => lineNoWS.trim().toUpperCase().indexOf(c + ' ') === 0)
      || commands.some(c => lineNoWS.trim().toUpperCase().indexOf(c + '\t') === 0)
      || commands.some(c => lineNoWS.trim().toUpperCase() === c)) {
      log('command:raw syscommand:' + lineNoWS)
      // const c = commands.find(cx => line.trim().toUpperCase().indexOf(cx) === 0)
      // const replaceExp = new RegExp('^' + c, "ig")
      // const commandExec = line.replace(replaceExp, 'await spawnCommand(`' + c.toLowerCase()) + "`)"
      //console.log('adding', commandExec)
      // currentCommands.push(commandExec)
      currentCommands.push(lineNoWS)
      return ''
      //This is a command
    } else {
      if (currentCommands.length) {
        const combined = 'await __spawnCommand(`' + currentCommands.join('&') + '`)' + '\r\n' + line
        //console.log('putting in', combined)
        currentCommands = []
        log('adding combined:' + combined + '\r\n' + line)
        return combined
      }
    }
    log('js:' + line)
    return line
  }).join('\r\n') + '; await __spawnCommand(`' + currentCommands.join('&') + '`)'

  let currentCode = 0

  function __setErrorCode(code) {
    currentCode = code
  }

  let lastSpawnLine = ''

  const formatScriptArg = (arg) => {
    return arg.replace(/^"|"$/g, '')
  }

  function __spawnCommand(script, sendOutput = true) {
    if (!script) {
      return
    }
    let spawnOutput = ''
    const args = script.split(' ').map(a => a.replace(/"/, '')) //script.split(' ').filter(s => s.trim() !== '').map(formatScriptArg)
    // console.log('Passing', args)
    // const proc = spawn('cmd.exe', ['/c', ...args], {shell: true}) // + " & <nul (set /p ___njsrunner=NJS_RUNNER_END_OF_SCRIPT)"])
    let proc;
    try {
      proc = spawn(script, {shell: true})// + " & <nul (set /p ___njsrunner=NJS_RUNNER_END_OF_SCRIPT)"])
      proc.on('error', (err) => undefined)
    } catch(e) { }
    if (echoCommands && !silentMode) {
      console.log(script)
    }
    log(script)
    proc.stdout.on('data', (data) => {
      const toWrite = data.toString() // data.toString().replace(/(\r\n|\r|\n)/g, '')
      lastSpawnLine = toWrite
      if (data.toString().trim().indexOf('NJS_RUNNER_END_OF_SCRIPT') > -1) {
        return
      }
      log('received stdout data', data.toString())
      spawnOutput += spawnOutput ? '\r\n' + toWrite : toWrite
      sendOutput && !silentMode && console.log(toWrite)
    })

    proc.stderr.on('data', (data) => {
      const toWrite = data.toString() // data.toString().replace(/(\r\n|\r|\n)/g, '')
      lastSpawnLine = toWrite
      log('received err data', data)
      if (data.toString().trim().indexOf('NJS_RUNNER_END_OF_SCRIPT') > -1) {
        return
      }
      spawnOutput += spawnOutput ? '\r\n' + toWrite : toWrite
      sendOutput && !silentMode && console.log(toWrite)
    })

    return new Promise((res, rej) => {
      const handleClose = (code) => {
        log('exiting spawnCommand with', code.toString())
        __setErrorCode(code)
        lastCommand.output = spawnOutput
        lastCommand.errorLevel = code
        res(code)
      }
      proc.on('exit', handleClose)
      proc.on('close', handleClose)
    })

  }

  async function __spawnScript(script) {
    if (!script) {
      return
    }
    return new Promise((res, rej) => {
      temp.open('node-runner', function (err, info) {
        if (!err) {
          fs.writeSync(info.fd, script)
          fs.close(info.fd, function (err) {
            __spawnCommand('MOVE ' + info.path + ' ' + info.path + '.bat', false)
              .then(res(__spawnCommand(info.path + '.bat', false)))
          })
        }
      })
    })
  }

  const augmented = `(async function(__spawnCommand, __spawnScript, __setErrorCode,
    edge, runScript, __exitAfter, quit, exit) {
  ${processed}
  ;if(__exitAfter) { process.exit(currentCode) }
})`
//console.log(augmented)
  let userFunc;
  try {
    userFunc = eval(augmented)
    if(debugMode) { console.log('Script:'); console.log(augmented) }
    if(debugMode) { messages.forEach(m => console.log(m))}
  } catch(e) {
    console.error('Error parsing generated script', e.message)
    console.log(augmented)
    messages.forEach((m) => console.log(m))
    throw e
  }

  const promiseEdge = Object.assign({}, originalEdge, {
    func: (...edgeArgs) => {
      return (opts, fn, ...rest) => {
        if (!originalEdge) {
          console.error('ERROR:', edgeError.message)
        }
        return () => undefined
        if (fn !== undefined) {
          return originalEdge.func.apply(originalEdge, [...edgeArgs])(opts, fn, ...rest)
        }
        else {
          return new Promise((res, rej) => originalEdge.func.apply(originalEdge, [...edgeArgs])(opts, (err, result) => {
            if (err) {
              throw err
            }
            res(result)
          }))
        }
      }
    }
  })

  try {
    await userFunc(
      __spawnCommand,
      __spawnScript,
      __setErrorCode,
      promiseEdge,
      async (args) => await __spawnCommand(...args),
      exitAfter,
      (exitCode) => quit(exitCode === undefined ? lastCommand.errorLevel : exitCode),
      (exitCode) => quit(exitCode === undefined ? lastCommand.errorLevel : exitCode))
  } catch(e) {
    console.error('Error executing generated script', e.message)
    console.log(augmented)
    throw e
  }

  return {
    lastCommand,
  }
}

module.exports = {
  executeScript
}
