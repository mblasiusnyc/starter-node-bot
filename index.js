var Botkit = require('botkit')

var token = process.env.SLACK_TOKEN

var controller = Botkit.slackbot({
  // reconnect to Slack RTM when connection goes bad
  retry: Infinity,
  debug: false
})

// Assume single team mode if we have a SLACK_TOKEN
if (token) {
  console.log('Starting in single-team mode')
  controller.spawn({
    token: token
  }).startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error(err)
    }

    console.log('Connected to Slack RTM')
  })
// Otherwise assume multi-team mode - setup beep boop resourcer connection
} else {
  console.log('Starting in Beep Boop multi-team mode')
  require('beepboop-botkit').start(controller, { debug: true })
}

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "TimeToTalkBot has joined the channel.")
})

controller.hears(['/(.*)time to talk(.*)/g]', ['message_received'], function (bot, message) {
  bot.reply(message, 'message.match[0]: ', message.match[0])
  bot.reply(message, 'message.match[1]: ', message.match[1])
  bot.startConversation(message, function(err, convo){
    convo.ask('You mentioned that you would like to talk to Mike about ' + message.match[1] + '. Would you like to set up a meeting to do so?', function(response, convo) {
      if(response.toLowercase() == 'yes') {
        convo.ask('Great! When would you like to talk to Mike?', function(response, convo) {
          var suggestedTime = response;
          convo.say('You said you want to meet at ' + suggestedTime)
          convo.next()
        })
      } else {
        convo.say('Alrighty then.')
        convo.next()
      }
    })
  })
})

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})


