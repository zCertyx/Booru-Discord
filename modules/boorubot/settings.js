//Edit and view settings
module.exports.config = {
  name: 'settings',
  invokers: ['settings', 'setting', 'seting', 'set'],
  help: 'Change/view settings',
  expandedHelp: 'Change/View settings for BooruBot\nRequires "Manage Server" perms to change',
  usage: ['View settings', 'setting', 'Get setting info', 'setting [settingName]', 'Set new setting', 'setting nsfwServer true']
}

const fs = require('fs')

const setTemplate = {
  topicEnable: {
    type: 'boolean',
    default: 'false',
    help: 'Only allow BooruBot to search in channels with `bb=true` in the topic (Other commands will still work, except no invite link for BB will be posted).'
  },

  nsfwServer: {
    type: 'boolean',
    default: 'false',
    help: 'Makes the bot treat every channel on the server as nsfw. By default only sfw images are posted out of nsfw channels.'
  },

  minScore: {
    type: 'number',
    default: 'null',
    help: 'The minimum score an image should have to be posted, `null` means no limit. Setting it too high will make BooruBot not return most images, something like `-5` is a good cut off point.'
  },

  deprecationWarning: {
    type: 'boolean',
    default: 'true',
    help: 'Warn if a user tries to use a deprecated command (Like `=help`).'
  }
}

const space = '\u00b7' //MIDDLE DOT

module.exports.events = {}
module.exports.events.message = (bot, message) => {
  let settingsId = (message.guild !== null) ? message.guild.id : message.channel.id //DMs are a channel, interestingly enough
  let settings = bot.sleet.settings.get(settingsId) //yay settings
  let [cmd, setting, ...value] = bot.sleet.shlex(message.content)

  value = value.join(' ')

    //b!settings aSetting true
    //['settings', 'aSetting', 'true']
    // 0           1           2

  if (setting === undefined) { //List all the settings
    let options = []
    let longest = 1
    for (let option in setTemplate) {
      options.push([option, settings.options[option]])
      if (option.length > longest) longest = option.length
    }

    message.channel.send(`Current settings\n${'='.repeat(longest + 3)}\n${options.map(v => v[0] + space.repeat(longest - v[0].length + 1) + ':: ' + v[1]).join('\n')}\n\nUse 'b!setting [setting]' for more info.`, {code: 'asciidoc'})

  } else if (value === '') { //List one setting + info
    if (setTemplate[setting])
      message.channel.send(`${setting}\n${'='.repeat(setting.length)}\nType${space.repeat(4)}:: ${setTemplate[setting].type}\nDefault${space}:: ${setTemplate[setting].default}\nCurrent${space}:: ${settings.options[setting]}\n\n${setTemplate[setting].help}`, {code: 'asciidoc'})
    else
      message.channel.send('That is probably not a valid setting.')
  } else { //Set a setting
    if (setTemplate[setting] === undefined)
      return message.channel.send('That\'s not a valid setting! Use `b!setting` to view them all')

    if (message.guild && !message.member.permissions.has('MANAGE_GUILD') && message.author.id !== bot.sleet.config.owner.id)
      return message.channel.send('You don\'t have "Manage Server" perms.')

    let newVal

    if (setTemplate[setting].type === 'string') {
      newVal = value
    } else {
      newVal = toPrim(value)
    }

    if (typeof newVal !== setTemplate[setting].type && newVal !== null)
      return message.channel.send(`The types don't match! You need a ${setTemplate[setting].type}!`)

    settings.options[setting] = newVal
    message.channel.send(`Setting changed!\n\`${setting}\` = \`${settings.options[setting]}\``)
  }

  bot.sleet.settings.set(settingsId, settings)
}

//Convert stuff to it's primitive values
//'True'      => true
//'false'     => false
//'342'       => 342
//'stringsda' => 'stringsda'
//'52332adsa' => '52332adsa'

function toPrim(val) {
  let prim = ((parseFloat(val) == val) ? parseFloat(val) : null) || ((val.toLowerCase() === 'true') ? true : null) || ((val.toLowerCase() === 'false') ? false : NaN)
  if (val.toLowerCase() === 'null') prim = null
  if (prim !== prim) prim = val //hacky fix since || will check the next one if it's false, meaning that false always returned a string
  return prim
}
