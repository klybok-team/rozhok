/*
MIT License

Copyright (c) 2022 Cliv Shape

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

let config = require('../config.js');

if(!config.token) return console.log('kto token bota ykral?');

const fs = require('fs');

if(!fs.existsSync('./temp')) { 
    console.log('Создание папки с временными файлами...')
    fs.mkdirSync('./temp');
};

const { Client, Collection } = require('eris');

const client = new Client(config.token, {
    allowedMentions: {
        everyone: false, 
        roles: false,
    },
});

client.cmd = new Collection();

const random = require('./functions/random.js');
const write = require('./functions/write.js');
const downloadFile = require('./functions/downloadFile.js');
const demotivatorImage = require('./functions/demotivatorImage.js');

for (const nameOfFile of fs.readdirSync('./cmd').filter(file => file.endsWith('.js'))) {
	const command = require(`./cmd/${nameOfFile}`);
	client.cmd.set(command.name, command);
}
client.on('messageCreate', async(m) => {
    if(m.author.bot) return;
    
    if (m.content.startsWith(config.commandsPrefix)) {
        const args = m.content.slice(config.commandsPrefix.length).trim().split(/ +/);
        const nameOfCommand = args.shift().toLowerCase();
    
        const command = client.cmd.get(nameOfCommand) || client.cmd.find(cmd => cmd.aliases && cmd.aliases.includes(nameOfCommand));
    
        if(!command) return;

        try {
            await command.execute(client, m, args.join(' '));
        } catch(e) {
            console.log(e);
            client.createMessage(m.channel.id, config.erorr);
        };
        return;
}
    let data;
    if(config.ourFile === false) { 
    if(!fs.existsSync(`../data/${m.guildID}_data.txt`)) {
        console.log('Обнаружена новая гильдия, создаю файл с текстом для неё..');

        fs.writeFileSync(`../data/${m.guildID}_data.txt`, 'привет');
    };

    data = fs.readFileSync(`../data/${m.guildID}_data.txt`, 'UTF-8');
}
if(config.ourFile === true) {
    data = fs.readFileSync(`../data/data.txt`, 'UTF-8');
}
    
    let lines = data.split(/\r?\n/);
    let imgdir = fs.readdirSync('../img');

    let trueOrNot;
    for(let idChannel of config.idChanneltoSaveAndWrite) {
        if(m.channel.id === idChannel) trueOrNot = true;
    };
    if(!trueOrNot) return;

    if(m.content.length < config.maxLenghtToWrite && config.saveAnyData) {
        let contentmessage = m.content.split('\n').join(' ')
        if(m.content && m.content != `<@${client.user.id}>`) write(contentmessage, config.ourFile, m.guildID);
        if (config.imgSaveAndUse && imgdir.length < config.limitimg) {
            for (let attachment of m.attachments) {
                if(attachment.filename.endsWith('.jpg') || attachment.filename.endsWith('.jpeg') || attachment.filename.endsWith('.png')) {
                let saveThisBoolean = false;
                if(config.imageFilter === 'low' && m.channel.guild.explicitContentFilter === 2) saveThisBoolean = true;
                if(config.imageFilter === 'none') saveThisBoolean = true;
                if(saveThisBoolean === true && !m.attachments[config.limitToImgOnce]) {
                    await downloadFile(`${attachment.url}`, `../img/${m.id}_${attachment.filename.replace('.jpg', '.jpeg')}`);
                    console.log(`Скачан файл: ${attachment.filename}`);
                };
            };
        };
    };
};

    if(!m.mentions.includes(client.user)) {
        if(!config.randomMessage) return;
        if (random(0, 11) < config.messageChance) {
            return;
        };
    };

    if (config.imgSaveAndUse) {
        if (random(0, 11) < 4) {
            const file = imgdir[random(0, imgdir.length)];
            if(random(0, 11) < config.demotivatorChance) {
                const image = await demotivatorImage(fs.readFileSync(`../img/${file}`), lines[random(0, lines.length)], lines[random(0, lines.length)]);

                return client.createMessage(m.channel.id, lines[random(0, lines.length)], [{ file: image, name: file }]);
            };
            try{
                let img = fs.readFileSync(`../img/${file}`);
                return client.createMessage(m.channel.id, lines[random(0, lines.length)], [{ file: img, name: file }]);
            } catch (e) {
                console.error(e);
            };
        };
    };
    if(random(0, 3) === 1) {
        return client.createMessage(m.channel.id, lines[random(0, lines.length)]);
    };
    return client.createMessage(m.channel.id, lines[random(0, lines.length)] + ' ' + lines[random(0, lines.length)]);
});
client.once('ready', () => {
    if(fs.readdirSync('../img').length >= config.limitimg) {
        console.log(`\x1b[31mМесто в ../img закончилось. ${fs.readdirSync('../img').length} из ${config.limitimg}\x1b[0m`);
    };
    console.log(`Готов,\nИмя: ${client.user.username}\nДОП. ИНФ.\nСсылка на аватарку: ${client.user.avatarURL}\nАйди клиента: ${client.user.id}\nКоличество серверов: ${client.guilds.size}\nРандомное число для откладки: ${random(0, 100)}`);
    if(!config.botonlineStatus) {
        console.log('У вас не указан онлайн-статус бота');
        config.botonlineStatus = "online";
    };
    if(!config.bottextStatus || !config.typeofStatus) {
        console.log('У вас не указан тип статуса или текст статуса, отключаем..');
        return client.editStatus(config.botonlineStatus);
    };
    return client.editStatus(config.botonlineStatus, { name: config.bottextStatus, type: config.typeofStatus });
});

client.on('error', (e) => {
    console.error(e);
});

process.on('SIGINT', () => {
	process.exit();
});

process.on('exit', () => {
    console.log('\x1b[31mПроцесс был закрыт.\n\x1b[0m');
	console.log('\nПроизвожу очистку..');
    if(config.tempClear) {
        console.log('Очищаю папку с временными файлами..');
        require('fs').rmdirSync('./temp', { recursive: true, force: true });
    };
});

client.connect();