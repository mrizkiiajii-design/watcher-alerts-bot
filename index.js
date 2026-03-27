const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const axios = require("axios");

const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!TOKEN) throw new Error("TOKEN belum diisi");
if (!CHANNEL_ID) throw new Error("CHANNEL_ID belum diisi");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let lastTweetId = null;

async function getTweet() {
  try {
    const res = await axios.get(
      "https://cdn.syndication.twimg.com/timeline/profile?screen_name=WatcherGuru",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const tweets = res.data?.globalObjects?.tweets;
    if (!tweets) {
      console.log("Tweet data kosong");
      return;
    }

    const latest = Object.values(tweets)[0];
    if (!latest) return;

    if (latest.id_str === lastTweetId) return;
    lastTweetId = latest.id_str;

    await sendToDiscord(latest);
  } catch (err) {
    console.error("getTweet error:", err?.response?.data || err?.message || err);
  }
}

async function sendToDiscord(tweet) {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
      throw new Error("Channel tidak ketemu");
    }

    if (!channel.isTextBased()) {
      throw new Error("Channel bukan text channel");
    }

    const url = `https://twitter.com/WatcherGuru/status/${tweet.id_str}`;

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setAuthor({
        name: "Watcher.Guru (@WatcherGuru)",
        iconURL: "https://pbs.twimg.com/profile_images/1593637000000000000/logo.jpg"
      })
      .setDescription(tweet.full_text || tweet.text || "New post")
      .setFooter({ text: "X • Live" });

    if (tweet.entities?.media?.[0]?.media_url_https) {
      embed.setImage(tweet.entities.media[0].media_url_https);
    }

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("View Post")
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );

    await channel.send({
      content: "🚨 **New Alert**",
      embeds: [embed],
      components: [button]
    });

    console.log("Pesan berhasil dikirim");
  } catch (err) {
    console.error("sendToDiscord error:", err?.rawError || err?.response?.data || err?.message || err);
  }
}

client.once("ready", async () => {
  try {
    console.log(`Logged in as ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
      throw new Error("Channel tidak ketemu saat startup");
    }

    if (!channel.isTextBased()) {
      throw new Error("Channel startup bukan text channel");
    }

    await channel.send("🚀 BOT SIAP!");

    setInterval(getTweet, 10000);
  } catch (err) {
    console.error("ready error:", err?.rawError || err?.response?.data || err?.message || err);
  }
});

client.login(TOKEN);
