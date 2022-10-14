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
        coalition: {
            type: {
                players: {
                    type: [{
                        id: {
                            type: String,
                            required: true,
                            index: {
                                unique: true
                            }
                        },
                        name: {
                            type: String,
                            required: true,
                            default: ''
                        },
                        kills: {
                            type: Number,
                            required: true,
                            default: 0
                        },
                        deaths: {
                            type: Number,
                            required: true,
                            default: 0
                        },
                        points: {
                            type: Number,
                            required: true,
                            default: 0
                        }
                    }],
                    required: true,
                    default: []
                },
                status: {
                    type: String,
                    required: true,
                    default: 'Unknown'
                }
            },
            required: true,
            default: {}
        },
        breach: {
            type: {
                players: {
                    type: [{
                        id: {
                            type: String,
                            required: true,
                            index: {
                                unique: true
                            }
                        },
                        name: {
                            type: String,
                            required: true,
                            default: ''
                        },
                        kills: {
                            type: Number,
                            required: true,
                            default: 0
                        },
                        deaths: {
                            type: Number,
                            required: true,
                            default: 0
                        },
                        points: {
                            type: Number,
                            required: true,
                            default: 0
                        }
                    }],
                    required: true,
                    default: []
                },
                status: {
                    type: String,
                    required: true,
                    default: 'Unknown'
                }
            },
            required: true,
            default: {}
        },
        host: {
            type: {
                id: {
                    type: String,
                    required: true,
                    default: ''
                },
                name: {
                    type: String,
                    required: true,
                    default: ''
                }
            },
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
            type: {
                id: {
                    type: String,
                    required: true,
                    default: ''
                },
                name: {
                    type: String,
                    required: true,
                    default: ''
                },
                timestamp: {
                    type: Number,
                    required: true,
                    default: 0
                }
            },
            required: true,
            default: {}
        },
        invalidator: {
            type: {
                id: {
                    type: String,
                    required: true,
                    default: ''
                },
                name: {
                    type: String,
                    required: true,
                    default: ''
                },
                timestamp: {
                    type: Number,
                    required: true,
                    default: 0
                }
            },
            required: true,
            default: {}
        },
        message_id: {
            type: String,
            required: true,
            default: ''
        },
        screenshot: {
            type: String,
            required: true,
            default: ''
        },
        score: {
            type: String,
            required: true,
            default: '0-0'
        }
    },
    {
        id: false
    }
);

module.exports = model('MatchStats', MatchStatsSchema, 'MatchStats');