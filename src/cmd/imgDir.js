const config = require('../../config.js')
const fs = require('fs')
module.exports = {
	name: 'imgDir',
	aliases: ['img'],
    desc: '[DEV-команда] предназначена для управления категорией /img',
    devAccess: true,
	async execute(client, m, args) {
        if(!args) {
            const imgList = fs.readdirSync('../img').join('\n')
            return client.createMessage(m.channel.id, `Привет ${m.member.nick}!\n\nСписок действий:\n\`Удалить\`: {имя файла} del\n\`Показать\`: {имя файла}\n\nСписок файлов:`, [{ file: `${imgList}`, name: 'preview.txt' }]);
        };

        args = args.toString().split(' ');

        if(args[0] && !args[1]) {
            if(fs.existsSync(`../img/${args[0]}`)) {
                const img = fs.readFileSync(`../img/${args[0]}`);
            
                return client.createMessage(m.channel.id, 'Для удаления добавьте `del -yes` или `del -y` в конец', [{ file: img, name: 'preview.png' }])
            }
            return client.createMessage(m.channel.id, 'Такого файла нет.')
        }
        if(args[1] === 'del') {
            if(args[2] === '-yes' || args[2] === '-y') {
                if(fs.existsSync(`../img/${args[0]}`)) {
                    fs.rm(`../img/${args[0]}`, func());
                    return client.createMessage(m.channel.id, 'Если вы видите это сообщение, значит бот не крашнулся и скорее всего все прошло успешно.');
                }
                return client.createMessage(m.channel.id, 'Такого файла нет.')
            }
        }
	}
};