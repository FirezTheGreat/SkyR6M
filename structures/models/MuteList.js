const { Schema, model } = require('mongoose');

const MuteListSchema = new Schema({
    id: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    roles: {
        type: [String],
        required: true,
        default: []
    },
    time: {
        type: Number,
        required: true,
        default: 0
    }
});

module.exports = model('MuteList', MuteListSchema, 'MuteList');