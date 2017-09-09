ECHO hi!
const foo = 5
COPY foo foo2.txt
copy foo foo3.txt
console.log('I got', lastCommand.output, 'and', foo)
DIR
console.log('dir has', lastCommand.output)

/*runscript
ECHO Yay! A Script!
GOTO :FOO
:FOO
EXIT /b
end*/

var ffs = new ActiveXObject("Scripting.FileSystemObject")
ECHO blah >test.txt
ECHO Okay, let's see what it is...
var objFile = ffs.OpenTextFile("test.txt")
var line = objFile.ReadLine()

console.log('Got this!', line)

objFile.Close()
ffs.DeleteFile('test.txt')

const fn = edge.func(`
    async (input) => {
        return ".NET Welcomes " + input.ToString();
    }
`)

fn('yay', function(err, result) {
    console.log(result)
})
const res = await fn('yay await')
console.log(res)

