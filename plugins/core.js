module.exports =  function createSum (args) {
    const NodeRSA = require('node-rsa')
    const crypto = require('crypto')
    const { Server } = require("socket.io")
    const io = new Server(args.port, {})
    if (args.echo)
        console.log("\nstarted on: ws://0.0.0.0:" + args.port)

    return {
        "Server":Server,
        "io":io,
        "NodeRSA":NodeRSA,
        "crypto":crypto
    }
}

module.exports.serverInit = function init (sum) {

    const aeskey = sum["core.js"].data.crypto.randomBytes(32);
    const aesiv = sum["core.js"].data.crypto.randomBytes(16);
    
    const key = new sum['core.js'].data.NodeRSA()
    
    function encrypt(data,key,iv) {
        const text = typeof data === 'string' ? data : JSON.stringify(data);

        const cipher = sum["core.js"].data.crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    function decrypt(encryptedText,key,iv) {
      const decipher = sum["core.js"].data.crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    let ids = [0]
    sum['core.js'].data.io.on("connection", (socket) => {
        const id = ids[ids.length-1] + 1
        ids.push(id)
        
        key.importKey(socket.handshake.query.publicKey, 'public')

        socket.emit("keyHandshake", {"data":  key.encrypt({"aesiv":aesiv,"aeskey":aeskey}, 'base64'), "id":"server"})

        console.log(`connected: \n  id:${id}\n  host:${socket.handshake.headers.host}`)
        
        socket.on("disconnect", (reason) => {
            console.log(`disconnected: \n  id:${socket.id}\n  host:${socket.handshake.headers.host}\n  reason:${reason}`)
        })
        socket.on("send_message", (message) => {
            const decmessage = decrypt(message,aeskey,aesiv)
            console.log(`message [${id}]: ${decmessage}`); 
            socket.broadcast.emit('receive_message', encrypt({"data": decmessage, "id":id},aeskey,aesiv))
        })
    })
}

module.exports.clientInit = function init (sum) {
}