const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

const NUMERO_VIDROS = '556181532529@c.us';  
const NUMERO_MOLDURAS = '556183523174@c.us'; 

const sessions = {};
const lastInteraction = {}; 


const TEMPO_LIMITE = 8 * 60 * 60 * 1000; 

client.on('qr', (qr) => {
    console.log('QR Code gerado, escaneie com seu WhatsApp!');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🤖 Bot está online!');
});

client.on('message', async (msg) => {
    if (msg.from.includes('@g.us')) {
        console.log('Mensagem de grupo ignorada:', msg.from);
        return;
    }

     
    const hora = new Date().getHours();
    if (hora < 8 || hora >= 18) {
        client.sendMessage(msg.from, '⚠️ Estamos fora do horário de atendimento (08h às 18h). Assim que possível, entraremos em contato!');
        return;
    }

    const userId = msg.from;
    const text = msg.body.trim();
    const agora = Date.now(); 

    
    if (lastInteraction[userId] && agora - lastInteraction[userId] < TEMPO_LIMITE) {
        return; 
    }

    
    if (!sessions[userId]) {
        sessions[userId] = { step: 1 };
        client.sendMessage(userId, 'Olá, bem-vindo à Norart Vidros e Molduras! Para iniciar seu atendimento, favor me informe seu nome.');
        return;
    }

    
    if (sessions[userId].step === 1) {
        sessions[userId].nome = text;
        sessions[userId].step = 2;
        client.sendMessage(userId, `Obrigado, ${text}! Agora escolha entre as seguintes opções para que eu te atenda melhor:\n\n1️⃣ Vidros\n2️⃣ Molduras`);
        return;
    }

    
    if (sessions[userId].step === 2) {
        if (text === '1' || text.toLowerCase() === 'vidros') {
            client.sendMessage(userId, 'Você escolheu **Vidros**! Um atendente entrará em contato com você em breve. 📞');

            
            const numeroLimpo = userId.replace('@c.us', '');
            client.sendMessage(NUMERO_VIDROS, `🔔 Novo atendimento!\n👤 Cliente: ${sessions[userId].nome}\n📞 Número: ${numeroLimpo}`);


            lastInteraction[userId] = agora; 
            delete sessions[userId]; 
            return;
        }

        if (text === '2' || text.toLowerCase() === 'molduras') {
            client.sendMessage(userId, 'Você escolheu **Molduras**! Um atendente entrará em contato com você em breve. 📞');

            
            if (NUMERO_MOLDURAS !== client.info.wid._serialized) {
                const numeroLimpo = userId.replace('@c.us', '');
                client.sendMessage(NUMERO_MOLDURAS, `🔔 Novo atendimento!\n👤 Cliente: ${sessions[userId].nome}\n📞 Número: ${numeroLimpo}`);                
            }

            lastInteraction[userId] = agora; 
            delete sessions[userId]; 
            return;
        }

        client.sendMessage(userId, 'Opção inválida! Por favor, escolha entre:\n\n1️⃣ Vidros\n2️⃣ Molduras');
    }
});

client.initialize();
