const SkyR6M = require('./structures/SkyR6M.js');
const config = require('./config.json');

const bot = new SkyR6M(config);
bot.start();