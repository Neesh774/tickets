import { DMChannel, Message, ThreadChannel } from 'discord.js';

import CommandHandler from '@classes/CommandHandler';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';

export default class MessageEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'messageCreate', false);
    }

    async run(message: Message) {
        if (message.author.bot || message.channel.type === 'DM') return;
    }
}
