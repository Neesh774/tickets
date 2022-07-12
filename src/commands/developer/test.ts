import { CommandInteraction, MessageActionRow, MessageButton, MessageSelectMenu, Modal, ModalActionRowComponent, SelectMenuInteraction, TextInputComponent } from 'discord.js';

import Logger from '@classes/Logger';
import { SlashCommandBuilder } from '@discordjs/builders';
import Command from '@structures/Command';
import DiscordClient from '@structures/DiscordClient';

export default class SayCommand extends Command {
    constructor(client: DiscordClient) {
        super(
            client,
            {
                group: 'Developer',
                require: {
                    developer: true
                }
            },
            new SlashCommandBuilder()
                .setName('test')
                .setDescription('Dev command')
        );
    }

    async run(command: CommandInteraction) {
        const channel = command.channel;
        const typePrompt = await channel.send({
            content: `${command.user.toString()}`,
            embeds: [{
                title: "Create Ticket",
                description: "Please fill out the information below to complete creating your ticket. Press the red button below to cancel the process at any time.",
                footer: { text: 'Ticket Creation • 1/2' }
            }],
            components: [new MessageActionRow().addComponents(new MessageButton().setCustomId('cancel').setLabel("Cancel").setStyle('DANGER')), new MessageActionRow().addComponents(
                new MessageSelectMenu().setCustomId('ticket-info').setOptions(
                    {
                        label: 'Graphic',
                        value: 'GRAPHIC',
                        description: 'Request a graphic such as a logo or banner.'
                    },
                    {
                        label: 'UI Design',
                        value: 'UI',
                        description: 'Request a UI design, like for a website or a mobile app.'
                    },
                    {
                        label: 'Development',
                        value: 'DEV',
                        description: 'Request a development project, like a bot or a website backend.'
                    },
                    {
                        label: "Naming",
                        value: 'NAMING',
                        description: "Request help with naming a project."
                    },
                    {
                        label: '3D Design',
                        value: '3D',
                        description: 'Request a 3D design, like a model or a mockup.'
                    },
                    {
                        label: 'Motion',
                        value: 'MOTION',
                        description: 'Request a motion graphic, like a video or a GIF.'
                    }
                ).setMaxValues(1).setMinValues(1)
            )]
        })
        const typeFilter = (i: SelectMenuInteraction) => i.customId == 'ticket-info' && i.user.id == command.user.id;
        await typePrompt.awaitMessageComponent({ componentType: 'SELECT_MENU', time: 1000, filter: typeFilter }).then(async (select: SelectMenuInteraction) => {
        }).catch((e) => {
            Logger.log("WARNING", (e.code == "INTERACTION_COLLECTOR_ERROR") + "")
        })
    }
}
