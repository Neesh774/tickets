# Flow Tickets

This bot allows users to press a button to create a ticket in their DMs, and creates a new channel for them and the appropriate team member. This bot is very expandable, and new commands or events can be created through the `commands` or `events` folders.

## Usage

1. [Create a Discord bot](https://discordpy.readthedocs.io/en/stable/discord.html)
2. Create a `.env` file using `.env.example`.
3. Run `npm install` to install libraries
4. Run `npm run dev`

## Commands

-   /sendTicketEmbed

    `src/commands/admin/sendTicketEmbed.ts`

    **Admin**

    This command simply sends a button in the channel it was used in for server members to create tickets.

## Classes

-   TicketHandler

    `src/classes/TicketHandler.ts`

    This class has two methods, `createTicket` and `cancelTicket`. It also contains a collection of ongoing tickets **that will reset every time the bot goes down**. If it resets, all tickets that were inside of that collection **cannot be cancelled through the bot**. `createTicket` and `cancelTicket` are run through `src/events/interactionCreate.ts` whenever the command is used or the cancel button is pressed. In bot logs, there may occasionally be messages such as **WARNING: undefined**. These are not an error, and do not need to be worried about. If it starts with **WARNING** but the message is not undefined, there is an issue.

Created by CheesyNeesh#5076 (DM if there are problems)
