const { App } = require('@slack/bolt');

// Initializes your app in socket mode with your app token and signing secret. Classe/instância App declarada na variável app
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true, // add this
    appToken: process.env.SLACK_APP_TOKEN, // add this
    port: process.env.PORT || 3000
});

// Listens to incoming messages that contain "hello". Método message da classe app.
app.message('hello', async ({ message, say }) => { // função anônima de callback, com um argumento com duas propriedades
    // say() sends a message to the channel where the event was triggered
    await say(`Hey there <@${message.user}>!`);
});

app.message('fala', async ({ message, say }) => { // função anônima de callback, com um argumento com duas propriedades
    // say() sends a message to the channel where the event was triggered
    console.log('Falaaa'); // imprime no terminal
});

(async () => {
  // Start your app
  await app.start(); // start: método disponível da classe App (olhar doc do slackbot)

  console.log('⚡️ Bolt app is running!');
})();