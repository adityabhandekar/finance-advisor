const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
        name: String,
        age: Number,
        occupation: String,
        annualIncome: Number
    },
    financialProfile: {
        riskTolerance: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Moderate' },
        investmentHorizon: String,
        monthlySavingsCapacity: Number
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);