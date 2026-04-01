const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const Parser = require("rss-parser");

const parser = new Parser();

const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!TOKEN) throw new Error("TOKEN belum diisi");
if (!CHANNEL_ID) throw new Error("CHANNEL_ID belum diisi");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let lastPostLink = null;

async function getTweet() {
  try {
    const feed = await parser.parseURL("https://nitter.net/WatcherGuru/rss");

    const latest = feed.items?.[0];
    if (!latest) {
      console.log("RSS kosong");
      return;
    }

    if (latest.link === lastPostLink) return;
    lastPostLink = latest.link;

    await sendToDiscord(latest);
  } catch (err) {
    console.error("RSS error:", err?.message || err);
  }
}

async function sendToDiscord(item) {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
      throw new Error("Channel tidak ketemu");
    }

    if (!channel.isTextBased()) {
      throw new Error("Channel bukan text channel");
    }

    const url = item.link;
    const text = item.contentSnippet || item.content || item.title || "New post";

    const embed = new EmbedBuilder()
      .setColor(0x00bfff)
      .setAuthor({
        name: "Watcher.Guru (@WatcherGuru)",
        iconURL: "https://pbs.twimg.com/profile_images/1593637000000000000/logo.jpg"
      })
      .setDescription(text)
      .setFooter({ text: "X • RSS Live" })
      .setURL(url);

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

    console.log("Pesan berhasil dikirim:", url);
  } catch (err) {
    console.error("sendToDiscord error:", err?.rawError || err?.message || err);
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

    await channel.send("🚀 BOT SIAP! (RSS mode)");

    await getTweet();
    setInterval(getTweet, 30000);
  } catch (err) {
    console.error("ready error:", err?.rawError || err?.message || err);
  }
});

client.login(TOKEN);
