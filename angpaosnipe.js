// # โปรแกรมดักซองผ่านดิสครอด

// - สามารถนำไปใช้ต่อได้ / ดัดแปลงและขายต่อได้ แต่ต้องเป็น Open Source ทั้งหมด!!
// - หากไม่เข้าใจให้อ่าน - https://www.gnu.org/licenses/gpl-3.0.html

//- Made By https://axmilin.in.th/ <3

const { Client } = require('discord.js-selfbot-v13');
const { Webhook, MessageBuilder } = require('minimal-discord-webhook-node');
const twvoucher = require('@fortune-inc/tw-voucher');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const { token, phones, url, urlfail } = config;

const client = new Client({
    checkUpdate: false
});

// # โปรแกรมดักซองผ่านดิสครอด

// - สามารถนำไปใช้ต่อได้ / ดัดแปลงและขายต่อได้ แต่ต้องเป็น Open Source ทั้งหมด!!
// - หากไม่เข้าใจให้อ่าน - https://www.gnu.org/licenses/gpl-3.0.html

//- Made By https://axmilin.in.th/ <3

client.on('ready', async () => {
    console.log("░█████╗░███╗░░██╗░██████╗░██████╗░░█████╗░░█████╗░  ░██████╗███╗░░██╗██╗██████╗░███████╗██████╗░\n██╔══██╗████╗░██║██╔════╝░██╔══██╗██╔══██╗██╔══██╗  ██╔════╝████╗░██║██║██╔══██╗██╔════╝██╔══██╗\n███████║██╔██╗██║██║░░██╗░██████╔╝███████║██║░░██║  ╚█████╗░██╔██╗██║██║██████╔╝█████╗░░██████╔╝\n██╔══██║██║╚████║██║░░╚██╗██╔═══╝░██╔══██║██║░░██║  ░╚═══██╗██║╚████║██║██╔═══╝░██╔══╝░░██╔══██╗\n██║░░██║██║░╚███║╚██████╔╝██║░░░░░██║░░██║╚█████╔╝  ██████╔╝██║░╚███║██║██║░░░░░███████╗██║░░██║\n╚═╝░░╚═╝╚═╝░░╚══╝░╚═════╝░╚═╝░░░░░╚═╝░░╚═╝░╚════╝░  ╚═════╝░╚═╝░░╚══╝╚═╝╚═╝░░░░░╚══════╝╚═╝░░╚═╝");
    console.log(`Username : ${client.user.username}`);
    console.log(`Phone Numbers : ${phones.join(', ')}`);
});

client.on('messageCreate', (message) => {
    const regex = /(https:\/\/gift\.truemoney\.com\/campaign\/\?v=[a-zA-Z0-9]{35})/;

    phones.forEach(phone => {
        if (message.embeds.length > 0) {
            message.embeds.forEach(embed => processEmbed(phone, embed, message));
        }
        if (message.content.match(regex)) {
            processContent(phone, message, message.content);
        }
    });
    console.log(`${message.guild ? message.guild.name : "DM"} | ${message.author.username}: ${message.content}`);
});

function processEmbed(phone, embed, message) {
    const regex = /(https:\/\/gift\.truemoney\.com\/campaign\/\?v=[a-zA-Z0-9]{35})/;
    const url = embed.url || (embed.author && embed.author.url);

    if (url && url.match(regex)) {
        redeemVoucher(phone, url, message);
    }
}

function processContent(phone, message, content) {
    redeemVoucher(phone, content, message);
}

function redeemVoucher(phone, voucherUrl, message) {
    twvoucher(phone, voucherUrl).then(redeemed => {
        const hook = new Webhook(url);
        const embed = new MessageBuilder()
            .setTitle('**ดักอังเปา ( Success )**')
            .setDescription('_ _')
            .addField('> สถานะ', '`✅`: ดักสำเร็จ !')
            .addField('> ลิ้งค์ซอง', voucherUrl)
            .addField('> ส่งโดย', message.author.username)
            .addField('> ส่งจาก', message.guild ? message.guild.name : "DM")
            .addField('> ชื่อเจ้าของซอง', redeemed.owner_full_name)
            .addField('> จำนวนเงิน', `${redeemed.amount} บาท`)
            .addField('> เบอร์ที่รับ', `${phone}`)
            .setColor('#94ffe1')
            .setTimestamp();

        hook.send(embed);
        console.log(`[${phone}] Redeemed ${redeemed.amount} บาท from ${redeemed.owner_full_name}`);
    }).catch(err => {
        const hookFail = new Webhook(urlfail);
        const embedFail = new MessageBuilder()
            .setTitle('**ดักอังเปา ( Fail )**')
            .setDescription('_ _')
            .addField('> สถานะ', '`❌`: ดักไม่สำเร็จ')
            .addField('> ลิ้งค์ซอง', voucherUrl)
            .addField('> ส่งโดย', message.author.username)
            .addField('> ส่งจาก', message.guild ? message.guild.name : "DM")
            .addField('> เบอร์ที่รับ', `${phone}`)
            .setColor('#f5190a')
            .setTimestamp();

        hookFail.send(embedFail);
        console.error(`[${phone}] Failed to redeem voucher: ${err.message}`);
    });
}

client.login(token);

// # โปรแกรมดักซองผ่านดิสครอด

// - สามารถนำไปใช้ต่อได้ / ดัดแปลงและขายต่อได้ แต่ต้องเป็น Open Source ทั้งหมด!!
// - หากไม่เข้าใจให้อ่าน - https://www.gnu.org/licenses/gpl-3.0.html

//- Made By https://axmilin.in.th/ <3