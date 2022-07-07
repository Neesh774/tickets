import DiscordClient from "@structures/DiscordClient";
import { capitalize } from "@utils/functions";
import { ITicket } from "@utils/interfaces";
import { ButtonInteraction, Collection, Message, MessageActionRow, MessageButton, MessageSelectMenu, Permissions, SelectMenuInteraction } from "discord.js";
import Logger from "./Logger";

export default class TicketHandler {
    static tickets: Collection<string, ITicket> = new Collection();
    static sessions: string[] = [];
    /**
     * Creates a new ticket
     */
    static async createTicket(client: DiscordClient, interaction: ButtonInteraction) {
        const user = interaction.user;
        let cancelled = false;
        if (this.tickets.has(user.id)) {
            await interaction.reply({ content: `You already have a ticket open. ${this.tickets.get(user.id).channel.toString()}`, ephemeral: true });
            return;
        }
        else if (this.sessions.includes(user.id)) {
            await interaction.reply({ content: `You are already creating a ticket. Check your DMs!`, ephemeral: true });
            return;
        }
        this.sessions.push(user.id)
        interaction.reply({ content: "Check your DMs!", ephemeral: true })
        const ticket = {
            user: user
        } as ITicket;
        const channel = await user.createDM();
        const typePrompt = await channel.send({
            content: `${user.toString()}`,
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
        const cancelFilter = (i: ButtonInteraction) => i.customId == "cancel" && i.user.id == user.id;
        channel.createMessageComponentCollector({ componentType: 'BUTTON', filter: cancelFilter }).on('collect', async (i: ButtonInteraction) => {
            cancelled = true;
            this.sessions = this.sessions.filter(u => u != user.id)
            await i.update({
                components: [new MessageActionRow().addComponents(new MessageButton().setCustomId('cancel').setLabel("Cancel").setStyle('DANGER').setDisabled(true))]
            })
            await i.followUp("Your ticket creation was cancelled.")
        })
        const typeFilter = (i: SelectMenuInteraction) => i.customId == 'ticket-info' && i.user.id == user.id;
        if (cancelled) return;
        await typePrompt.awaitMessageComponent({ componentType: 'SELECT_MENU', time: 60000, filter: typeFilter }).then(async (select: SelectMenuInteraction) => {
            if (cancelled) return;
            const type = select.values[0] as ITicket['type'];
            ticket.type = type;
            await select.reply({
                embeds: [{
                    title: "Create Ticket",
                    description: "Now, please send a brief description of your project and how we can help.",
                    footer: { text: 'Ticket Creation • 2/2' }
                }]
            })
        }).catch((e) => {
            Logger.log("WARNING", e.stack)
        })
        const descFilter = (m: Message) => {
            return m.author.id == user.id;
        };
        if (cancelled) return;
        await channel.awaitMessages({ filter: descFilter, maxProcessed: 1, time: 60000, errors: ['time'] }).then(async (collected) => {
            if (cancelled) return;
            const desc = collected.first().content;
            ticket.description = desc;
            await channel.send({
                embeds: [{
                    title: "Create Ticket",
                    description: "Your ticket has been created! The appropriate team members have been notified.",
                    footer: { text: 'Ticket Creation' }
                }]
            })
        }).catch(async (e) => {
            Logger.log("WARNING", e.stack);
        })
        const teamMap = {
            'GRAPHIC': ['842436092509814834'],
            'MOTION': ['842436092509814834'],
            'UI': ['296050830455603209'],
            'OTHER': ['296050830455603209'],
            'NAMING': ['296050830455603209'],
            'DEV': ['297504183282565130', '844639886472118303'],
            '3D': ['974773450340184104']
        }
        const team = teamMap[ticket.type];
        if (cancelled) return;
        ticket.channel = await interaction.guild.channels.create(`${ticket.type.toLowerCase()}-${user.username}`, {
            reason: `${user.tag} created a ticket.`,
            type: 'GUILD_TEXT',
            permissionOverwrites: [{
                id: interaction.guild.id,
                deny: [Permissions.FLAGS.VIEW_CHANNEL]
            }, {
                id: user.id,
                allow: [Permissions.FLAGS.VIEW_CHANNEL]
            }]
        });
        await ticket.channel.send({
            content: user.toString() + ", " + team.map(id => `<@${id}>`).join(', '),
            embeds: [{
                title: `✉️ New ${capitalize(ticket.type)} Ticket`,
                description: `${user.toString()} has created a new ticket.\n\`\`\`${ticket.description}\`\`\``,
                timestamp: new Date()
            }]
        })
        ticket.createdAt = new Date();
        this.sessions = this.sessions.filter((u) => u != user.id)
        this.tickets.set(user.id, ticket);
    }
}