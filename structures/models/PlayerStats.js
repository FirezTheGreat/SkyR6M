const { Schema, model } = require('mongoose');
const { Roles } = require('../../config.json');

const PlayerStatsSchema = new Schema({
    id: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    name: {
        type: String,
        required: true
    },
    rank: {
        type: String,
        required: true,
        default: Roles.DefaultRoleName
    },
    matches: {
        type: Number,
        required: true,
        default: 0
    },
    wins: {
        type: Number,
        required: true,
        default: 0
    },
    loses: {
        type: Number,
        required: true,
        default: 0
    },
    current_points: {
        type: Number,
        required: true,
        default: 0
    },
    total_points: {
        type: Number,
        required: true,
        default: 0
    },
    penalties: {
        type: Object,
        required: true,
        default: {}
    },
    exclusive: {
        type: Object,
        required: true,
        default: {}
    },
    tickets: {
        type: [Object],
        required: true,
        default: []
    },
    pings: {
        type: Object,
        required: true,
        default: {}
    }
});

module.exports = model('PlayerStats', PlayerStatsSchema, 'PlayerStats');