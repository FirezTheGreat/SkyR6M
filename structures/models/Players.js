const { Schema, model } = require('mongoose');
const { Roles } = require('../../config.json');

const PlayersSchema = new Schema(
    {
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
        points: {
            type: {
                current: {
                    type: Number,
                    required: true,
                    default: 0
                },
                total: {
                    type: Number,
                    required: true,
                    default: 0
                }
            },
            required: true,
            default: {
                current: 0,
                total: 0
            },
            _id: false
        },
        statistics: {
            type: {
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
                matches: {
                    type: Number,
                    required: true,
                    default: 0
                }
            },
            required: true,
            default: {
                kills: 0,
                deaths: 0,
                wins: 0,
                loses: 0,
                matches: 0
            },
            _id: false
        },
        penalties: {
            type: {
                count: {
                    type: Number,
                    required: true,
                    default: 0
                },
                events: {
                    type: [{
                        id: {
                            type: String,
                            required: true,
                            index: {
                                unique: true
                            }
                        },
                        reason: {
                            type: String,
                            required: true,
                            default: 'None'
                        },
                        points: {
                            type: Number,
                            required: true,
                            default: 0
                        }
                    }],
                    required: true,
                    default: []
                }
            },
            required: true,
            default: {
                count: 0,
                events: []
            },
            _id: false
        },
        exclusive: {
            type: {
                subscribed: {
                    type: Boolean,
                    required: true,
                    default: false
                },
                queue_id: {
                    type: String,
                    required: false
                },
                cooldown: {
                    type: Boolean,
                    required: true,
                    default: false
                },
                cooldown_time: {
                    type: Number,
                    required: true,
                    default: 0
                },
                subscriptions: {
                    type: [{
                        id: {
                            type: String,
                            required: true,
                            index: {
                                unique: true
                            }
                        },
                        queue_id: {
                            type: String,
                            required: true
                        },
                        start_timestamp: {
                            type: Number,
                            required: true,
                            default: 0
                        },
                        duration_timestamp: {
                            type: Number,
                            required: true,
                            default: 0
                        },
                        host: {
                            type: Boolean,
                            required: true,
                            default: false
                        },
                        players: {
                            type: [{
                                id: {
                                    type: String,
                                    required: true
                                },
                                name: {
                                    type: String,
                                    default: false
                                }
                            }],
                            required: true,
                            default: []
                        }
                    }],
                    required: true,
                    default: [],
                    _id: false
                }
            },
            required: true,
            default: {
                subscribed: false,
                queue_id: '',
                cooldown: false,
                cooldown_time: 0,
                subscriptions: []
            },
            _id: false
        },
        tickets: {
            type: [{
                id: {
                    type: String,
                    required: true,
                    index: {
                        unique: true
                    }
                },
                transcript: {
                    type: String,
                    required: true,
                    default: 'Unavailable'
                },
                channel_id: {
                    type: String,
                    required: true
                },
                active: {
                    type: Boolean,
                    required: true,
                    default: false
                },
                created_timestamp: {
                    type: Number,
                    required: true,
                    default: Date.now()
                },
                ended_timestamp: {
                    type: Number,
                    required: true,
                    default: 0
                }
            }],
            required: true,
            default: []
        },
        pings: {
            type: {
                total_pings: {
                    type: Number,
                    required: true,
                    default: 0
                },
                ping_interval: {
                    type: Number,
                    required: true,
                    default: 0
                },
                daily_pings: {
                    type: Number,
                    required: true,
                    default: 0
                },
                daily_substitute_cooldown: {
                    type: Number,
                    required: true,
                    default: 0
                }
            },
            required: true,
            default: {
                total_pings: 0,
                ping_interval: 0,
                daily_pings: 0,
                daily_substitute_cooldown: 0
            },
            _id: false
        },
        logs: {
            type: {
                matches: {
                    type: [{
                        id: {
                            type: String,
                            required: true,
                            index: {
                                unique: true
                            }
                        },
                        points: {
                            type: Number,
                            required: true,
                            default: 0
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
                        map: {
                            type: String,
                            required: true,
                            default: ''
                        },
                        description: {
                            type: String,
                            required: true,
                            default: ''
                        },
                        status: {
                            type: String,
                            required: true,
                            default: 'Unknown'
                        }
                    }],
                    required: true,
                    default: []
                },
                penalties: {
                    type: [{
                        id: {
                            type: String,
                            required: true,
                            index: {
                                unique: true
                            }
                        },
                        reason: {
                            type: String,
                            required: true,
                            default: 'None'
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
                                },
                            },
                            required: true,
                            default: {}
                        }
                    }],
                    required: true,
                    default: []
                }
            },
            required: true,
            default: {
                matches: [],
                penalties: []
            },
            _id: false
        },
        previous_players: {
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
                status: {
                    type: String,
                    required: true,
                    default: 'Unknown'
                }
            }],
            required: true,
            default: []
        },
        achievements: {
            type: [{
                id: {
                    type: String,
                    required: true,
                    index: {
                        unique: true
                    }
                },
                description: {
                    type: String,
                    required: true,
                    default: 'None'
                },
            }],
            required: true,
            default: []
        },
        _roles: {
            type: [String],
            required: true,
            default: []
        }
    },
    {
        id: false
    }
);

module.exports = model('Players', PlayersSchema, 'Players');