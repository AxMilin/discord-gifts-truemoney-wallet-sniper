const { Client } = require('discord.js-selfbot-v13');
const { Webhook, MessageBuilder } = require('minimal-discord-webhook-node');
const twvoucher = require('@fortune-inc/tw-voucher');
const Tesseract = require('tesseract.js');
const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const { Semaphore } = require('async-mutex');

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const { token, phones, url, urlfail } = config;

const client = new Client({
    checkUpdate: false
});

// # โปรแกรมดักซองผ่านดิสครอด

// - สามารถนำไปใช้ต่อได้ / ดัดแปลงและขายต่อได้ แต่ต้องเป็น Open Source ทั้งหมด!!
// - หากไม่เข้าใจให้อ่าน - https://www.gnu.org/licenses/gpl-3.0.html

//- Made By https://axmilin.in.th/ <3

// Concurrency limit for processImage
const imageSemaphore = new Semaphore(2);

client.on('ready', async () => {
    console.log("░█████╗░███╗░░██╗░██████╗░██████╗░░█████╗░░█████╗░  ░██████╗███╗░░██╗██╗██████╗░███████╗██████╗░\n██╔══██╗████╗░██║██╔════╝░██╔══██╗██╔══██╗██╔══██╗  ██╔════╝████╗░██║██║██╔══██╗██╔════╝██╔══██╗\n███████║██╔██╗██║██║░░██╗░██████╔╝███████║██║░░██║  ╚█████╗░██╔██╗██║██║██████╔╝█████╗░░██████╔╝\n██╔══██║██║╚████║██║░░╚██╗██╔═══╝░██╔══██║██║░░██║  ░╚═══██╗██║╚████║██║██╔═══╝░██╔══╝░░██╔══██╗\n██║░░██║██║░╚███║╚██████╔╝██║░░░░░██║░░██║╚█████╔╝  ██████╔╝██║░╚███║██║██║░░░░░███████╗██║░░██║\n╚═╝░░╚═╝╚═╝░░╚══╝░╚═════╝░╚═╝░░░░░╚═╝░░╚═╝░╚════╝░  ╚═════╝░╚═╝░░╚══╝╚═╝╚═╝░░░░░╚══════╝╚═╝░░╚═╝");
    console.log(`Username : ${client.user.username}`);
    console.log(`Phone Numbers : ${phones.join(', ')}`);
});

client.on('messageCreate', async (message) => {
    const regex = /(https:\/\/gift\.truemoney\.com\/campaign\/\?v=[a-zA-Z0-9]{35})/;

    phones.forEach(phone => {
        if (message.embeds.length > 0) {
            message.embeds.forEach(embed => {
                processEmbed(phone, embed, message); // High priority
                if (embed.image && embed.image.url) {
                    queueProcessImage(embed.image.url, phone, message); // Lower priority
                }
            });
        }
        if (message.content.match(regex)) {
            redeemVoucher(phone, message.content, message); // High priority
        }
        if (message.attachments.size > 0) {
            message.attachments.forEach(attachment => {
                if (attachment.contentType.startsWith('image/')) {
                    queueProcessImage(attachment.url, phone, message); // Lower priority
                }
            });
        }
    });

    console.log(`${message.guild ? message.guild.name : "DM"} | ${message.author.username}: ${message.content}`);
});

function queueProcessImage(imageUrl, phone, message) {
    setImmediate(async () => {
        await imageSemaphore.runExclusive(async () => {
            await processImage(imageUrl, phone, message);
        });
    });
}

async function processImage(imageUrl, phone, message) {
    const regex = /(https:\/\/gift\.truemoney\.com\/campaign\/\?v=[a-zA-Z0-9]{35})/;

    try {
        const image = await loadImage(imageUrl);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
        if (qrCode && qrCode.data.match(regex)) {
            const voucherUrl = qrCode.data.match(regex)[0];
            redeemVoucher(phone, voucherUrl, message);
        }
    } catch (err) {
        console.error('QR Code Error:', err.message);
    }
}

function processEmbed(phone, embed, message) {
    const regex = /(https:\/\/gift\.truemoney\.com\/campaign\/\?v=[a-zA-Z0-9]{35})/;
    const url = embed.url || (embed.author && embed.author.url);

    if (url && url.match(regex)) {
        redeemVoucher(phone, url, message);
    }
}

function redeemVoucher(phone, voucherUrl, message) {
    twvoucher(phone, voucherUrl).then(redeemed => {
        const hook = new Webhook(url);
        const embed = new MessageBuilder()
            .setTitle('**ดักอังเปา ( Success )**')
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
