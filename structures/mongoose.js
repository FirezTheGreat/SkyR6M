let { connect, Promise, connection } = require('mongoose');
const { MongoURL } = require('../config.json');

/**
 * @class Sky Mongoose
 */

module.exports = class SkyMongoose {
    /**
     * Initiates Mongoose Client
     */

    init() {
        const dbOptions = {
            autoIndex: false,
            family: 4,
            connectTimeoutMS: 10000
        };

        connect(MongoURL, dbOptions);
        Promise = global.Promise;

        connection.on('connected', () => {
            console.log('Connected to MongoDB Successfully!');
        });

        connection.on('err', (error) => {
            console.error(`Error Occured From MongoDB: \n${error.message}`);
        });

        connection.on('disconnected', () => {
            console.warn('Connection Disconnected!');
        });
    }
};