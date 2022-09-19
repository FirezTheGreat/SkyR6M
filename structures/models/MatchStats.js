const { Schema, model } = require('mongoose');

const MatchStatsSchema = new Schema(
    {
        id: {
            type: String,
            required: true,
            index: {
                unique: true
            }
        },
        map: {
            type: String,
            required: true,
            default: ''
        },
        winners: {
            type: [Object],
            required: true,
            default: []
        },
        losers: {
            type: [Object],
            required: true,
            default: []
        },
        host: {
            type: Object,
            required: true,
            default: {}
        },
        timestamp: {
            type: Number,
            required: true,
            default: Date.now()
        },
        invalidated: {
            type: Boolean,
            required: true,
            default: false
        },
        allocated: {
            type: Boolean,
            required: true,
            default: false
        },
        allocator: {
            type: Object,
            required: true,
            default: {}
        },
        message_id: {
            type: String,
            required: true,
            default: ''
        }
    },
    {
        id: false
    }
);

module.exports = model('MatchStats', MatchStatsSchema, 'MatchStats');