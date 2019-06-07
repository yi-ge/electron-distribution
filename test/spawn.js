const { spawn } = require('child_process')
const fs = require('fs')

const writerStream = fs.createWriteStream('test/test.log', {flags: 'a'})

const cmd = `rsync -avrz -e 'ssh -p 22' --delete-after --exclude "node_modules" /data/ykfz/source/ root@xxxxxxx:/tmp/ykfz`
writerStream.write(cmd)
const rsync = spawn('/bin/sh', ['-c', cmd])
rsync.stdout.pipe(writerStream)
rsync.stderr.pipe(writerStream)

rsync.on('close', (code) => {
  const writerStream = fs.createWriteStream('test/test.log', {flags: 'a'})
  writerStream.write(`\nChild process exited with code ${code} \n`)
})
