const mongoose = require('mongoose');

const meterSchema = new mongoose.Schema({
    data: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const Meter = mongoose.model('Meter', meterSchema);

module.exports = Meter;