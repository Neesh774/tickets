import { Interaction } from 'discord.js';

import CommandHandler from '@classes/CommandHandler';
import DiscordClient from '@structures/DiscordClient';
import Event from '@structures/Event';
import TicketHandler from '@classes/TicketHandler';

export default class InteractionEvent extends Event {
    constructor(client: DiscordClient) {
        super(client, 'interactionCreate', false);
    }

    async run(interaction: Interaction) {
        if (interaction.isCommand()) return await CommandHandler.handleCommand(this.client, interaction);
        else if (interaction.isAutocomplete()) return CommandHandler.handleAutocomplete(this.client, interaction);
        else if (interaction.isButton() && interaction.customId == "create-ticket") {
            TicketHandler.createTicket(this.client, interaction);
        }
        else if (interaction.isButton() && interaction.customId.startsWith('close-')) {
            TicketHandler.closeTicket(this.client, interaction);
        }
    }
}
