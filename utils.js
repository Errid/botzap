// utils.js
// Add any helper functions here

function formatOrderList(order) {
    if (!order || order.length === 0) return 'Seu pedido está vazio.';
    return order.map((item, idx) => `${idx + 1}️⃣ ${item}`).join('\n');
}

module.exports = { formatOrderList };
