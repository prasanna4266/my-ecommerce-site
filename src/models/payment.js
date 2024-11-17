const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    paymentDate: Date,
    method: String, // e.g., 'Credit Card', 'PayPal', etc.
    status: String, // e.g., 'successful', 'failed'
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
