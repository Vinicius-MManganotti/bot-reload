const { App } = require('@slack/bolt');
const { exec } = require('child_process');

// Initializes your app in socket mode with your app token and signing secret. Classe/instância App declarada na variável app
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true, // add this
    appToken: process.env.SLACK_APP_TOKEN, // add this
    port: process.env.PORT || 3000,
    customRoutes: [
        {
          path: '/health-check',
          method: ['GET'],
          handler: (req, res) => {
            res.writeHead(200);
            res.end(`Things are going just fine at ${req.headers.host}!`);
          },
        },
        {
            path: '/circle-ci',
            method: ['POST'],
            handler: (req, res) => {
              let body = '';
              req.on('data', buffer => {
                body += decodeURIComponent(buffer.toString());
              });
              req.on('end', async () => {
                const result = JSON.parse(body);
                exec('ls -l', (error, stdout, stderr) => {
                  if (error) {
                    console.error(`Error: ${error.message}`);
                    return;
                  }
                  console.log(`stdout: ${stdout}`);
                  console.error(`stderr: ${stderr}`);
                });                
                console.log('result', result.pipeline.vcs.branch);
                res.writeHead(200);
                res.end();
              });
            }
        },
    ]    
});

// Listens to incoming messages that contain "hello". Método message da classe app.
app.message('hello', async ({ message, say }) => { // função anônima de callback, com um argumento com duas propriedades
    // say() sends a message to the channel where the event was triggered
    await say(`Hey there <@${message.user}>!`);
});

app.message('fala', async ({ message, say }) => { // função anônima de callback, com um argumento com duas propriedades
    // say() sends a message to the channel where the event was triggered
    console.log('Salveee'); // imprime no terminal
});

(async () => {
  // Start your app
  await app.start(); // start: método disponível da classe App (olhar doc do slackbot)

  console.log('⚡️ Bolt app is running!');
})();