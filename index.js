var Botkit = require('botkit')
var schedule = require('node-schedule');
var request = require('request');

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

// controller.on('bot_channel_join', function (bot, message) {
//   bot.reply(message, "I'm here!")
// })

// controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
//   bot.reply(message, 'Hello')
// })

// controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
//   bot.reply(message, 'GET OUT!!!')
//   bot.reply(message, 'It\'s nice to talk to you directly.')
// })

controller.hears('(@.*) time to talk about (.*)\?', ['direct_message', 'message_received', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'I heard a message.')
  var recipient = message.match[0].split(':')[0].substring(1, message.match[0].split(':')[0].length-1);
  var subject = message.match[2].replace('?', '');
  bot.reply(message, 'recipient: ' +recipient)
  bot.reply(message, 'subject: ' +subject)
  request.post({url:'https://slack.com/api/users.info', 
    form: {
      token: 'xoxp-47069036593-47053403748-47196571601-d72b35c5f7',
      user: recipient
    }
  }, function(err,httpResponse,body){
    recipient = JSON.parse(body).user;
    bot.reply(message, 'recipient: ' +recipient);

    bot.startConversation(message, function(err, convo){
      convo.ask('You mentioned that you would like to talk to '+recipient.name+' about ' +subject+ '. Would you like to set up a reminder to do so?', function(response, convo) {
        if(response.text == 'yes') {
          convo.next();
          convo.ask('Great! When would you like to talk to '+recipient.name+'?', function(response, convo) {
            convo.next();
            var suggestedTime = response.text;
            // convo.say('You said you want to meet at ' + suggestedTime)
            convo.ask('@'+recipient.name+': Are you available to meet at '+suggestedTime+' to discuss '+subject+'?', function(response, convo) {
              var recipientResponse = response.text;
              convo.next();
              if(recipientResponse == 'yes') {
                convo.say('Great! I will remind you when its time to talk with @'+recipient.name+' about '+subject+'.');
                var hour = Number(suggestedTime.split(':')[0])+6;
                var minute = Number(suggestedTime.split(':')[1].substring(0,2));
                var ampm = suggestedTime.match(/PM/)
                if(ampm) hour = Number(hour)+12;
                var today = new Date();
                var date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute, 1);
                // bot.reply(message, 'hour: '+hour+ ' minute: '+minute+ ' ampm: '+ampm)
                // bot.reply(message, 'date: '+date)
                var reminder = schedule.scheduleJob(date, function(){
                  bot.reply(message, 'It is now time to talk about '+subject+'.');
                });
              } else {
                convo.say('Ok. I won\'t remind you');
              }
            })
          })
        } else {
          convo.say('Alrighty then.')
          convo.next()
        }
      })
    })
  })
})

// controller.hears(['time to talk'], ['direct_message'], function (bot, message) {
//   // start a conversation to handle this response.
//   bot.reply(message, 'The message was: ' + message)
//   bot.startConversation(message,function(err,convo) {

//     convo.ask('How are you?',function(response,convo) {

//       convo.say('Cool, you said: ' + response.text);
//       convo.next();

//     });

//   })
// })

// controller.hears('.*', ['mention'], function (bot, message) {
//   bot.reply(message, 'You really do care about me. :heart:')
// })

// controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
//   var help = 'I will respond to the following messages: \n' +
//       '`bot hi` for a simple message.\n' +
//       '`bot attachment` to see a Slack attachment message.\n' +
//       '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
//       '`bot help` to see this again.'
//   bot.reply(message, help)
// })

// controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
//   var text = 'Beep Beep Boop is a ridiculously simple hosting platform for your Slackbots.'
//   var attachments = [{
//     fallback: text,
//     pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
//     title: 'Host, deploy and share your bot in seconds.',
//     image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
//     title_link: 'https://beepboophq.com/',
//     text: text,
//     color: '#7CD197'
//   }]

//   bot.reply(message, {
//     attachments: attachments
//   }, function (err, resp) {
//     console.log(err, resp)
//   })
// })

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})


