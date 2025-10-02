// handlers.js
const { getUser, setUser, resetUser } = require('./userState');


// Show menu function
function showMenu(msg) {
    msg.reply(`\n🍽️ Menu de pedidos:\n1️⃣ Pizza\n2️⃣ Salgadinho\n3️⃣ Refrigerante\n4️⃣ Ver pedido\n5️⃣ Finalizar compra\nDigite o número da opção:`);
}

// Helper reply functions
function replyAndMenu(msg, text) {
    msg.reply(text);
    setTimeout(() => showMenu(msg), 400);
}

function handleMessage(msg) {
    const from = msg.from;
    const body = msg.body.trim().toLowerCase();
    const user = getUser(from);

    // Ask for name if not set
    if (!user.name || user.name.trim() === '') {
        if (!user.askName) {
            setUser(from, { askName: true });
            msg.reply('Olá! Qual é o seu nome?');
            return;
        } else {
            if (!body) {
                msg.reply('Por favor, digite um nome válido para continuar.');
                return;
            }
            setUser(from, { name: body, askName: false });
            msg.reply(`Bem-vindo, ${body}!`);
            setTimeout(() => showMenu(msg), 400);
            return;
        }
    }

    // Reset state on 'oi'
    if (body === 'oi') {
        resetUser(from);
        msg.reply('Olá! 👋 Me mande "menu" para ver as opções.');
        return;
    }

    if (body === 'menu') {
        setUser(from, { step: null, pedido: [] });
        showMenu(msg);
        return;
    }

    // Get current step
    const step = user.step;
    const pedido = user.pedido || [];

    // Remover item do pedido
    if (step === 'remover_item') {
        if (body === 'voltar') {
            setUser(from, { step: null });
            showMenu(msg);
            return;
        }
        const idx = parseInt(body);
        if (!isNaN(idx) && idx >= 1 && idx <= pedido.length) {
            const removido = pedido.splice(idx - 1, 1);
            setUser(from, { pedido });
            if (pedido.length === 0) {
                setUser(from, { step: null });
                msg.reply(`Item removido: ${removido}. Seu pedido está vazio.`);
                setTimeout(() => showMenu(msg), 400);
                return;
            }
            setUser(from, { step: 'remover_item', pedido });
            msg.reply(`Item removido: ${removido}.\n${require('./utils').formatOrderList(pedido)}\nDigite o número do item para remover ou "voltar" para retornar ao menu.`);
            return;
        }
        msg.reply('Opção inválida. Digite o número do item para remover ou "voltar" para retornar ao menu.');
        return;
    }

    // Main menu selection
    if (!step) {
        if (body === '1' || body === 'pizza') {
            setUser(from, { step: 'pizza' });
            msg.reply(`🍕 Escolha o sabor da pizza:\n1️⃣ Calabresa\n2️⃣ Mussarela\n3️⃣ Portuguesa\n4️⃣ Metade (escolher dois sabores)\nDigite o número ou nome do sabor:`);
            return;
        }
        if (body === '2' || body === 'salgadinho') {
            setUser(from, { step: 'salgadinho' });
            msg.reply(`🥟 Escolha o tipo de salgadinho:\n1️⃣ Bolinha de queijo\n2️⃣ Coxinha\n3️⃣ Kibe\n4️⃣ Enroladinho de queijo presunto\nDigite o número ou nome do salgadinho:`);
            return;
        }
        if (body === '3' || body === 'refrigerante') {
            setUser(from, { step: 'refrigerante' });
            msg.reply(`🥤 Escolha o refrigerante:\n1️⃣ Coca Cola 2L\n2️⃣ Guaraná 2L\n3️⃣ Coca Cola Zero 2L\n4️⃣ Guaraná Zero 2L\nDigite o número ou nome do refrigerante:`);
            return;
        }
        if (body === '4' || body === 'ver pedido') {
            if (pedido.length === 0) {
                msg.reply('Seu pedido está vazio.');
                return;
            }
            setUser(from, { step: 'remover_item' });
            msg.reply(require('./utils').formatOrderList(pedido) + '\nDigite o número do item para remover ou "voltar" para retornar ao menu.');
            return;
        }
        if (body === '5' || body === 'finalizar compra' || body === 'finalizar') {
            if (pedido.length === 0) {
                msg.reply('Seu pedido está vazio. Adicione itens antes de finalizar.');
                return;
            }
            // Preço aleatório entre 30 e 80
            const total = (Math.floor(Math.random() * 51) + 30).toFixed(2);
            setUser(from, { step: 'entrega', resumo: `Itens: ${pedido.join(', ')}\nTotal: R$ ${total}` });
            msg.reply(`Pedido finalizado!\n${pedido.join(', ')}\nTotal: R$ ${total}\nComo deseja receber?\n1️⃣ Buscar na loja\n2️⃣ Entrega\nDigite o número ou nome da opção:`);
            return;
        }
    }
    // Delivery or pickup step
    if (step === 'entrega') {
        if (body === '1' || body === 'buscar na loja' || body === 'buscar') {
            msg.reply(`Seu pedido:\n${user.resumo}\nRetire na loja, ${user.name}. Obrigado! 🍕🥤`);
            resetUser(from);
            return;
        }
        if (body === '2' || body === 'entrega') {
            setUser(from, { step: 'endereco' });
            msg.reply('Digite por favor seu endereço (rua/apt/bloco):');
            return;
        }
        msg.reply('Opção inválida. Por favor, digite o número ou nome da opção.');
        return;
    }

    // Address input for delivery
    if (step === 'endereco') {
        const endereco = msg.body.trim();
        msg.reply(`Seu pedido:\n${user.resumo}\nEndereço: ${endereco}\n${user.name}, seu pedido será entregue em breve! Obrigado! 🍕🥤`);
        resetUser(from);
        return;
    }

    // Pizza submenu
    if (step === 'pizza') {
        if (body === '4' || body === 'metade') {
            setUser(from, { step: 'metade', metadeCount: 0, sabores: [] });
            msg.reply('Você escolheu pizza metade a metade! Por favor, digite o nome do primeiro sabor:');
            return;
        }
        const sabores = ['calabresa', 'mussarela', 'portuguesa'];
        let saborEscolhido = body;
        if (body === '1') saborEscolhido = 'calabresa';
        if (body === '2') saborEscolhido = 'mussarela';
        if (body === '3') saborEscolhido = 'portuguesa';
        if (sabores.includes(saborEscolhido)) {
            pedido.push(`pizza de ${saborEscolhido}`);
            setUser(from, { step: null, pedido });
            replyAndMenu(msg, `Você escolheu pizza de ${saborEscolhido}!`);
            return;
        }
        msg.reply('Opção inválida. Por favor, digite o número ou nome do sabor.');
        return;
    }

    // Metade pizza
    if (step === 'metade') {
        const sabores = ['calabresa', 'mussarela', 'portuguesa'];
        if (sabores.includes(body)) {
            user.sabores.push(body);
            user.metadeCount++;
            if (user.metadeCount === 1) {
                msg.reply('Agora digite o nome do segundo sabor:');
            } else {
                const [sabor1, sabor2] = user.sabores;
                pedido.push(`pizza metade ${sabor1} e metade ${sabor2}`);
                setUser(from, { step: null, pedido });
                replyAndMenu(msg, `Você escolheu pizza metade ${sabor1} e metade ${sabor2}!`);
            }
        } else {
            msg.reply('Sabor inválido. Por favor, digite "calabresa", "mussarela" ou "portuguesa".');
        }
        return;
    }

    // Salgadinho submenu
    if (step === 'salgadinho') {
        const salgadinhos = ['bolinha de queijo', 'coxinha', 'kibe', 'enroladinho de queijo presunto'];
        let escolhido = body;
        if (body === '1') escolhido = 'bolinha de queijo';
        if (body === '2') escolhido = 'coxinha';
        if (body === '3') escolhido = 'kibe';
        if (body === '4') escolhido = 'enroladinho de queijo presunto';
        if (salgadinhos.includes(escolhido)) {
            pedido.push(escolhido);
            setUser(from, { step: null, pedido });
            replyAndMenu(msg, `Você escolheu ${escolhido}!`);
            return;
        }
        msg.reply('Opção inválida. Por favor, digite o número ou nome do salgadinho.');
        return;
    }

    // Refrigerante submenu
    if (step === 'refrigerante') {
        const refris = ['coca cola 2l', 'guaraná 2l', 'coca cola zero 2l', 'guaraná zero 2l'];
        let escolhido = body;
        if (body === '1') escolhido = 'coca cola 2l';
        if (body === '2') escolhido = 'guaraná 2l';
        if (body === '3') escolhido = 'coca cola zero 2l';
        if (body === '4') escolhido = 'guaraná zero 2l';
        if (refris.includes(escolhido)) {
            pedido.push(escolhido);
            setUser(from, { step: null, pedido });
            replyAndMenu(msg, `Você escolheu ${escolhido}!`);
            return;
        }
        msg.reply('Opção inválida. Por favor, digite o número ou nome do refrigerante.');
        return;
    }
}

module.exports = { handleMessage };