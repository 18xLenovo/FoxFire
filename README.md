# Fox_Flare

## Discord welcome bot

### Setup
- Install dependencies: `npm install`
- Create a `.env` file with your `DISCORD_TOKEN`.
- Ensure your Discord application has the **Server Members Intent** enabled in the Developer Portal.
- The bot will automatically send welcome messages to the server's system channel or the first available text channel.

### Run
- Start the bot: `npm start`
- The bot listens for new members and posts an orange-styled welcome embed (mention, username/tag, member number) in the configured channel.