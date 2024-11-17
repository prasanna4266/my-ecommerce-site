const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },});
    

// Define the User model based on the schema
const User = mongoose.model('User', UserSchema);

// Export the User model after it's defined
module.exports = User;
