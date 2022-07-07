import { ColorResolvable, CommandInteraction, MessageActionRow, MessageButton } from 'discord.js';

import Logger from '@classes/Logger';
import { SlashCommandBuilder } from '@discordjs/builders';
import Command from '@structures/Command';
import DiscordClient from '@structures/DiscordClient';

export default class SendTicketCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: 'Admin',
                require: {
                    permissions: ['MANAGE_GUILD']
                },
                ephemeral: true
            },
            new SlashCommandBuilder()
                .setName('send_ticket')
                .setDescription('Send the initial ticket embed.')
        );
    }

    async run(command: CommandInteraction) {
        await command.channel.send({
            embeds: [
                {
                    title: "Create a Ticket",
                    description: "Press the button below to be directed to your own ticket.",
                    color: process.env.FLOW_COLOR as ColorResolvable,
                }
            ],
            components: [
                new MessageActionRow().addComponents(
                    new MessageButton().setLabel("Create").setCustomId('create-ticket').setEmoji("📩").setStyle('PRIMARY')
                )
            ]
        })
        await command.editReply({ content: "Created the embed." })
    }
}
