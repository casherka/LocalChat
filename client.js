const { disconnect } = require('node:process');
const readline = require('node:readline');
const NodeRSA = require('node-rsa')
const crypto = require('crypto')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const key = new NodeRSA({b: 2048})
const publicKey = key.exportKey('public')
const privateKey = key.exportKey('private')
const { io } = require("socket.io-client")
const socket = io("ws://127.0.0.1:3000", {
  reconnectionDelayMax: 10000,
  auth: {
    token: "123"
  },
  query: {
    "publicKey": publicKey
  }
});

const aes = {}

function encrypt(data,key,iv) {
  const text = typeof data === 'string' ? data : JSON.stringify(data);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText,key,iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

socket.on("keyHandshake", (message) => {
  const decrypted = JSON.parse(key.decrypt(message.data, 'utf8'))
  aes['aesiv'] = decrypted.aesiv
  aes['aeskey'] = decrypted.aeskey
});

socket.on("receive_message", (message) => {
  process.stdout.write('\r\x1b[K----------------');
  const decMessage = JSON.parse(decrypt(message,Buffer.from(aes.aeskey.data),Buffer.from(aes.aesiv.data)))
  console.log(`\n   ${decMessage.id}: ${decMessage.data}`)
  rl.prompt(true);
});

socket.on("disconnect", () => {
  console.log('\n------\ndisconnected\n------')
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log("reconnecting attempt: " + attempt)
});

socket.io.on("reconnect", (attempt) => {
  console.log("------\nreconnected sucefully\n------")
  rl.prompt(true);
})

function askQuestion() {
  rl.question('message > ', (message) => {
    if (message.toLowerCase() === '/exit') {
      rl.close();
      return;
    } 
    if (message === '') {
      console.log("--empty messages are not sent--")
    } else {
      let encmessage = encrypt(message,Buffer.from(aes.aeskey.data),Buffer.from(aes.aesiv.data))
      socket.emit("send_message", encmessage)
    }
    askQuestion();
  });
}

console.log("\n/exit or ctrl+c to out")
askQuestion();

rl.on('close', () => {
  console.log('\n> exit <');
  socket.disconnect()
  process.exit(0);
});