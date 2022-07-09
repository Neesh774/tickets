// Setting up moment-timezone
import moment from 'moment-timezone';

// Getting and validating .env file
import EnvLoader from './classes/EnvLoader';

EnvLoader.load();

import DiscordClient from './structures/DiscordClient';


moment.locale('en');
moment.tz.setDefault('America/New_York');

const client = new DiscordClient(
    {
        intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES']
    },
    {
        token: process.env['TOKEN'],
        owners: ['297504183282565130']
    }
);

client.load();
export default client;
