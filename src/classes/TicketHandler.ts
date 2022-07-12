import DiscordClient from "@structures/DiscordClient";
import { capitalize } from "@utils/functions";
import { ITicket } from "@utils/interfaces";
import { ButtonInteraction, Collection, GuildMemberRoleManager, Message, MessageActionRow, MessageButton, MessageSelectMenu, Permissions, SelectMenuInteraction } from "discord.js";
import Logger from "./Logger";

export default class TicketHandler {
    static tickets: Collection<string, ITicket> = new Collection();
    static sessions: string[] = [];
    /**
     * Creates a new ticket
     */
    static async createTicket(client: DiscordClient, interaction: ButtonInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.user;
        let cancelled = false;
        if (this.tickets.has(user.id)) {
            await interaction.editReply({ content: `You already have a ticket open. ${this.tickets.get(user.id).channel.toString()}` });
            return;
        }
        else if (this.sessions.includes(user.id)) {
            await interaction.editReply({ content: `You are already creating a ticket. Check your DMs!` });
            return;
        }
        this.sessions.push(user.id)
        interaction.editReply({ content: "Check your DMs!" })
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
        const onError = async (e) => {
            if (e.code == "INTERACTION_COLLECTOR_ERROR") {
                cancelled = true;
                await typePrompt.edit({
                    components: []
                })
                return await channel.send({ content: "Ticket creation cancelled." });
            }
            await channel.send({ content: "An error occurred. Please try again later." });
            Logger.log("WARNING", e.stack);
        }
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
        }).catch(onError)
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
        }).catch(onError)
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
            }, {
                id: '821782360776900650',
                allow: [Permissions.FLAGS.VIEW_CHANNEL]
            }]
        });
        await ticket.channel.send({
            content: user.toString() + ", " + team.map(id => `<@${id}>`).join(', '),
            embeds: [{
                title: `✉️ New ${capitalize(ticket.type)} Ticket`,
                description: `${user.toString()} has created a new ticket.\n\`\`\`${ticket.description}\`\`\``,
                timestamp: new Date()
            }],
            components: [
                new MessageActionRow().addComponents(
                    new MessageButton().setCustomId(`close-${user.id}`).setLabel("Close Ticket").setStyle('PRIMARY')
                )
            ]
        }).then(async msg => {
            await msg.pin();
        })
        ticket.createdAt = new Date();
        this.sessions = this.sessions.filter((u) => u != user.id)
        this.tickets.set(user.id, ticket);
    }

    static async closeTicket(client: DiscordClient, interaction: ButtonInteraction) {
        const userID = interaction.customId.split('-')[1];
        const ticket = this.tickets.get(userID);
        const channel = interaction.channel;
        if (!ticket) return;
        await interaction.reply({ content: "⚠️ Are you sure you want to delete this ticket? **This action cannot be undone**. Reply with `yes` to confirm, or anything else to cancel." })
        const filter = (m: Message) => m.author.id == userID;
        await channel.awaitMessages({ filter: filter, maxProcessed: 1, time: 60000, errors: ['time'] }).then(async (collected) => {
            const msg = collected.first();
            if (msg.content.toLowerCase() == 'yes') {
                this.tickets.delete(userID);
                await msg.delete();
                await ticket.channel.permissionOverwrites.edit(userID, { VIEW_CHANNEL: false })
                await interaction.editReply({
                    content: "This ticket has been closed.",
                })
                const pinned = await interaction.channel.messages.fetchPinned();
                await pinned.first().edit({
                    components: [new MessageActionRow().addComponents(pinned.first().components[0].components[0].setDisabled(true))]
                })
            } else {
                await interaction.reply({ content: "Ticket deletion cancelled.", ephemeral: true })
            }
        }).catch(async (e) => {
            Logger.log("WARNING", e.stack);
        })
    }
}