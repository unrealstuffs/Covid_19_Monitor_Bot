require('dotenv').config();
const ICQ = require('icq-bot').default;
const cheerio = require('cheerio');
const axios = require('axios');

const bot = new ICQ.Bot(process.env.TOKEN);

const startCommand = new ICQ.Handler.Command("start", null, (bot, event) => {
    sendStartMessage(bot, event)
})

const handlerRegionMessage = new ICQ.Handler.Message(null, (bot, event) => {
    sendRegionMessage(event.text, bot, event)
})

const handlerButton = new ICQ.Handler.BotButtonCommand(null, (bot, event) => {
    const command = JSON.parse(event.data.callbackData)
    switch (command.name) {
        case 'about':
            sendAboutMessage(bot, event);
            break;
        case 'back':
            sendInfoMessage(bot, event);
            break;
    }
})

const sendStartMessage = (bot, event) => {
    let results = []

    axios.get('https://coronavirus-monitor.info/country/russia/')
        .then(response => {
            const $ = cheerio.load(response.data)
            $('.content .row.justify-content-center .col-md-4').each((i, elem) => {
                results.push(
                    $(elem).find('.stat_block h2').text()
                )
            })

            const stat = {}

            const [confirmed, confirmedPlus] = results[0].match(/([\d ]+)/g);
            stat.confirmed = `Заражено: ${confirmed} +(${confirmedPlus == undefined ? '0' : confirmedPlus})`

            const [recovered, recoveredPlus] = results[1].match(/([\d ]+)/g);
            stat.recovered = `Вылечено: ${recovered} +(${recoveredPlus == undefined ? '0' : recoveredPlus})`

            const [deaths, deathsPlus] = results[2].match(/([\d ]+)/g);
            stat.deaths = `Погибло: ${deaths} +(${deathsPlus == undefined ? '0' : deathsPlus})`

            const startMessage = `
Привет, ${event.messageAuthor.firstName} . Я могу помочь тебе наблюдать за изменениями в ситуации по коронавирусу в России. Общая статистика по России:

${stat.confirmed}
${stat.recovered}
${stat.deaths}

Введите название нужного региона. Из-за ограничений мессенджера, название необходимо вводить вручную и полностью. Например: Московская область
            `

            const buttonAbout = new ICQ.Button("О боте", `{"name": "about"}`)

            bot.sendText(event.fromChatId, startMessage, null, null, null, [buttonAbout])

        })
}

const sendInfoMessage = (bot, event) => {

    let results = []

    axios.get('https://coronavirus-monitor.info/country/russia/')
        .then(response => {

            const $ = cheerio.load(response.data)
            $('.content .row.justify-content-center .col-md-4').each((i, elem) => {
                results.push(
                    $(elem).find('.stat_block h2').text()
                )
            })

            const stat = {}

            const [confirmed, confirmedPlus] = results[0].match(/([\d ]+)/g);
            stat.confirmed = `Заражено: ${confirmed} +(${confirmedPlus == undefined ? '0' : confirmedPlus})`

            const [recovered, recoveredPlus] = results[1].match(/([\d ]+)/g);
            stat.recovered = `Вылечено: ${recovered} +(${recoveredPlus == undefined ? '0' : recoveredPlus})`

            const [deaths, deathsPlus] = results[2].match(/([\d ]+)/g);
            stat.deaths = `Погибло: ${deaths} +(${deathsPlus == undefined ? '0' : deathsPlus})`

            const startMessage = `
Общая статистика по России:

${stat.confirmed}
${stat.recovered}
${stat.deaths}

Введите название нужного региона. Из-за ограничений мессенджера, название необходимо вводить вручную и полностью. Например: Московская область
            `

            const buttonAbout = new ICQ.Button("О боте", `{"name": "about"}`)
            console.log(event)

            bot.sendText(event.data.message.chat.chatId, startMessage, null, null, null, [buttonAbout])

        })
}

const sendAboutMessage = (bot, event) => {
    const aboutMessage = `
        Бот написан на Node JS с использованием библиотеки "icq-bot". Используются данные с сайта https://coronavirus-monitor.info/country/russia/
    `

    const buttonGitHub = new ICQ.Button("GitHub", null, "https://github.com")
    const buttonBack = new ICQ.Button("Вернуться в меню", `{"name": "back"}`)

    bot.sendText(event.data.message.chat.chatId, aboutMessage, null, null, null, [buttonGitHub, buttonBack])
}

const sendRegionMessage = (region, bot, event) => {
    if (region[0] === '/') {
        return
    }

    axios.get('https://coronavirus-monitor.info/country/russia/')
        .then(response => {
            const data = [];
            const $ = cheerio.load(response.data)
            $('#russia_stats .flex-table:not(.header)').each((i, elem) => {
                data.push({
                    region: $(elem).find('div:nth-child(1)').text(),
                    confirmed: $(elem).find('div:nth-child(2)').text(),
                    deaths: $(elem).find('div:nth-child(3)').text(),
                    recovered: $(elem).find('div:nth-child(4)').text()
                })
            })
            
            data.forEach(item => {
                if(item.region.toLowerCase() === region.toLowerCase()) {
                    const stat = {}

                    const [confirmed, confirmedPlus] = item.confirmed.match(/([\d ]+)/g);
                    stat.confirmed = `Заражено: ${confirmed} +(${confirmedPlus === undefined ? '0' : confirmedPlus})`

                    const [recovered, recoveredPlus] = item.recovered.match(/([\d ]+)/g);
                    stat.recovered = `Вылечено: ${recovered} +(${recoveredPlus === undefined ? '0' : recoveredPlus})`

                    const [deaths, deathsPlus] = item.deaths.match(/([\d ]+)/g);
                    stat.deaths = `Погибло: ${deaths} +(${deathsPlus === undefined ? '+0' : deathsPlus})`

                    const startMessage = `
Статистика по региону ${item.region}:

${stat.confirmed}
${stat.recovered}
${stat.deaths}

Введи название другого региона или нажми на кнопку чтобы венуться в меню
`

                    const buttonAbout = new ICQ.Button("Вернуться", `{"name": "back"}`)

                    bot.sendText(event.data.chat.chatId, startMessage, null, null, null, [buttonAbout])
                }
            })
        })
}

bot.getDispatcher().addHandler(startCommand);
bot.getDispatcher().addHandler(handlerButton);
bot.getDispatcher().addHandler(handlerRegionMessage);

bot.startPolling();