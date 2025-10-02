const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handlers');

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🤖 Bot conectado ao WhatsApp!');
});

client.on('message', async msg => {
    console.log(`📩 Mensagem recebida de ${msg.from}: ${msg.body}`);
    handleMessage(msg);
});

client.initialize();
