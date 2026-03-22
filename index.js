const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let lastTweetId = null;

async function getTweet() {
    try {
        const res = await axios.get(
            "https://cdn.syndication.twimg.com/timeline/profile?screen_name=WatcherGuru"
        );

        const tweets = res.data.globalObjects.tweets;
        const latest = Object.values(tweets)[0];

        if (!latest) return;

        if (latest.id_str === lastTweetId) return;

        lastTweetId = latest.id_str;

        sendToDiscord(latest);

    } catch (err) {
        console.log("error:", err.message);
    }
}

async function sendToDiscord(tweet) {
    const channel = await client.channels.fetch(CHANNEL_ID);

    const url = `https://twitter.com/WatcherGuru/status/${tweet.id_str}`;

    const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setAuthor({
            name: "Watcher.Guru (@WatcherGuru)",
            iconURL: "https://pbs.twimg.com/profile_images/1593637000000000000/logo.jpg"
        })
        .setDescription(tweet.text)
        .setFooter({ text: "X • Live" });

    if (tweet.entities?.media) {
        embed.setImage(tweet.entities.media[0].media_url_https);
    }

    const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("View Post")
            .setStyle(ButtonStyle.Link)
            .setURL(url)
    );

    channel.send({
        content: "🚨 **New Alert**",
        embeds: [embed],
        components: [button]
    });
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID);
    channel.send("🚀 BOT SIAP!");

    setInterval(getTweet, 10000);
});

client.login(TOKEN);