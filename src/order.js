const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: { type: String, required: true, unique: true },
    paymentStatus: { type: String, enum: ['Paid', 'Pending'], required: true },
    address: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    items: [
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
    }, 
    ],
    date: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
