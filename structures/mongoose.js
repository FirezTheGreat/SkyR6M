let { connect, Promise, connection } = require('mongoose');

module.exports = {
    init: () => {
        const dbOptions = {
            autoIndex: false,
            family: 4,
            connectTimeoutMS: 10000
        };

        connect('', dbOptions);
        Promise = global.Promise;

        connection.on('connected', () => {
            console.log('Connected to MongoDB Successfully!');
        });

        connection.on('err', error => {
            console.error(`Error Occured From MongoDB: \n${error.message}`);
        });

        connection.on('disconnected', () => {
            console.warn('Connection Disconnected!');
        });
    }
};