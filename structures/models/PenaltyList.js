const { Schema, model } = require('mongoose');
const localized_time = new Date(new Date().getTime() + (330 + new Date().getTimezoneOffset()) * 60000).getTime();

const PenaltyListSchema = new Schema(
    {
        id: {
            type: String,
            required: true,
            index: {
                unique: true
            }
        },
        member_id: {
            type: String,
            required: true,
            default: ''
        },
        reason: {
            type: String,
            required: true,
            default: 'None'
        },
        start_timestamp: {
            type: Number,
            required: true,
            default: new Date(localized_time).getTime()
        },
        duration_timestamp: {
            type: Number,
            required: true,
            default: 0
        },
        points: {
            type: Number,
            required: true,
            default: 0
        },
        moderator: {
            type: {
                id: {
                    type: String,
                    required: true,
                    default: ''
                },
                tag: {
                    type: String,
                    required: true,
                    default: ''
                }
            },
            required: true,
            default: {}
        }
    },
    {
        id: false
    }
);

module.exports = model('PenaltyList', PenaltyListSchema, 'PenaltyList');