console.log(`NJS Script Runner
  === What is it ===
  This is totally a pet/whim project.
  I have done a significant amount of scripting in my career and wondered how hard it would be to make this.
  
  === How to use ===
  To use AciveX or Edge you probably need to install -g the windows-build-tools as admin, or setup VC++.
  You can install this globally, then run
    njscript [debug] repl
    njscript [debug] <filename>
    njscript --eval <script>
  While in REPL mode it will look for a .njsrc or _njsrc for options:
   - within %HOME%
   - current working directory
   - and current module directory.
  A sample .njsrc is included in the repo.

  === What it does ===
  It's sort of a script interpreter on top of node.js that borrows from edge.js and winax.
  This means you can...
  - interlace batch commands in your node.js script, or insert JS variables into batch commands
  - get the output/errorlevel of the batch commands you run within a node script
  - perform COM automation/ActiveXObject (thanks winax)
  - execute .NET code (thanks edge.js)
  Your script is executed inside of an async function, so you can use top-level 'await' calls.
  
  === How do I run batch commands? ===
  Many batch commands can just be run "as-is".
  For example, "COPY src.txt dest.txt" (without quotes) is valid in an NJS script.
  For more advanced scripts or embedding batch files, wrap them with
    //runscript
    REM Do some batch commands
    //end
  You can substitute "/*runscript" and "end*/" for the above, which is more friendly to JavaScript IDEs/editors.
  
  === How can I pass node.js variables to batch commands? ===
  There's a few ways to accomplish this.
    1. Use template strings interpolation
      //runscript blocks and batch commands are executed using a \`\` string (backticks/template string).
      This means you can run \${expression} expressions inside them.
      For example: ECHO \${2 + 2} will output 4. 
    2. Invoke NJS runner's spawnCommand directly
      ie: await __spawnCommand(\`ECHO \${2 + 2}\`)
  
  === What if I just want to run a one-liner from the terminal? ===
  Run NJS Runner with -eval "commands-separated-by-\\r\\n"
    ie: -eval "ECHO hi from batch\\r\\nconsole.log('hi from node')"
  
  === How do I access batch output? ===
  A special object "lastCommand" will have these properties:
    .output string
      The text output of the last batch command executed
    .errorLevel number
      The error code of the last batch command executed
  
  === How do I use ActiveXObject? ===
  Just use it as you would in a WSH/JScript program. IE:
    var fso = new ActiveXObject("Scripting.FileSystemObject")
  
  === How can I run .NET code? ===
  'edge' is already in scope, imported from edge.js, so just use it as you normally would.
  The one exception is that you can use promises instead of callbacks from edge.func, if you want to.
  
  === Handy/Helpful Stuff ===
  /*runscript's are really temporary batch files. You will have to escape things just like you would in a batch file.
  ie: for /f %f ... becomes for /f %%f ...
  
  lastCommand is the output of ALL of the commands that last ran after the last JavaScript statement -- combined.
  
  JavaScript programs cannot have statements that start with system commands NJS Runner recognizes with some exceptions.
  For example "echo".
  "IF" and "FOR" are valid BOTH in batch script AND in node.js, so it tries hard to figure out which one you mean.
  if(...) and if (...) will both be recognized as JavaScript. Most other "if"s are usually batch commands.
  
  GOTO doesn't work unless it's inside a /*runscript. Within a runscript, it can only jump to labels defined there.
  This could be fixable with some generator magickery... Maybe...
  
  NJS Runner has some convenient functions to make things easier for a large number of cases. For example:
  
  If NJS Runner doesn't know you're running a command/program, you can prefix it with "!"
  For example: !notepad will run notepad.
  This means statements cannot start with "!" in your JavaScript file.
  
  For Unix lovers:
    ls becomes dir
    touch checks if a file exists, and creates a file with one linebreak if it doesn't
    cat becomes type
    which becomes where
    pwd echoes the current directory
    rm becomes del but also switches / to \\
  
  
Copyright (c) 2017 Michael K Snead`)
process.exit(0)
