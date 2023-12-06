const { App } = require('@slack/bolt');
const { exec } = require('child_process');
const axios = require('axios');

// Initializes your app in socket mode with your app token and signing secret. Classe/instância App declarada na variável app
let branch = ""
let ambiente = ""
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
                branch = result.pipeline.vcs.branch;
                exec(`kubectl get pods --all-namespaces -o=jsonpath='{range .items[*]}{"\\n"}{.metadata.name}{","}{.metadata.namespace}{","}{range .spec.containers[*]}{.image}{end}{end}' | grep "${result.pipeline.vcs.branch}"`, (error, stdout, stderr) => {
                  if (error) {
                    console.error(`Error: ${error.message}`);
                    return;
                  }
                  ambiente = stdout.split(",")[1];
                  const nomeSobrenome = ambiente.split("-").slice(1,3);
                  const email = `${nomeSobrenome[0]}.${nomeSobrenome[1]}@rdstation.com`
                  console.log(email)
                  console.error(`stderr: ${stderr}`);
                  axios.get(`https://slack.com/api/users.lookupByEmail?email=${email}`, {
                    headers: {
                      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
                    }
                  })
                  .then(function (response) {
                  // manipula o sucesso da requisição
                    // console.log(response);
                    const id = response.data.user.id
                    console.log(id)
                    axios.post('https://slack.com/api/chat.postMessage', {
                      channel: id,
                      blocks: [
                          {
                            "type": "section",
                            "text": {
                              "type": "mrkdwn",
                              "text": "Olá! Vimos que a sua branch foi atualizada, gostaria de fazer a atualização do seu ambiente paas?"
                            },
                            "accessory": {
                              "type": "button",
                              "text": {
                                "type": "plain_text",
                                "text": "Click Me",
                                "emoji": true
                              },
                              "value": "click_me_123",
                              "action_id": "button-action"
                            }
                          }
                        ]
                      },
                    {
                      headers: {
                        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                        'Content-Type': 'application/json;charset=UTF-8',
                      }, 
                    })
                    .then(function (response) {
                      console.log(response.data);
                    })
                    .catch(function (error) {
                      console.error(error);
                    });
                  })
                  .catch(function (error) {
                    // manipula erros da requisição
                    console.error(error);
                  })
                });                
                // console.log('result', result.pipeline.vcs.branch);
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
    // coletar os pods e iterar sobre cada pod, para fazer o comando de atualizar imagem
    // pegar o nome de todos os pods e guardar em um array
    exec(`kubectl get pods --all-namespaces -o=jsonpath='{range .items[*]}{"\\n"}{.metadata.name}{","}{range .spec.containers[*]}{.image}{","}{.name}{end}{end}' | grep "guilhermeeric-patch-2"`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      const linhas = stdout.trim().split('\n');
      const deployments = [];
      linhas.forEach(linha => {
        const elementos = linha.split(',');
        const deployment = elementos[2];
        deployments.push(deployment);
        exec(`kubectl set image deployment/${deployment} ${deployment}=gcr.io/rd-devops/rdstation-prod:${branch} --namespace=${ambiente}`, async (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error.message}`);
            return;
          }
        })
      })
      console.log(deployments);
      await say(stdout)
      // executar o seguinte comando para cada deployment (for)
    })
    console.log('Salveee'); // imprime no terminal
    
});

app.action('button-action', async ({ ack, say }) => { // função anônima de callback, com um argumento com duas propriedades
  // say() sends a message to the channel where the event was triggered
  await ack();
  
  await say('Belezaaa')
});

(async () => {
  // Start your app
  await app.start(); // start: método disponível da classe App (olhar doc do slackbot)
  console.log('⚡️ Bolt app is running!');
})();