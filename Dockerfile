FROM node:18

WORKDIR /app

COPY . .

RUN npm install
RUN npm install -g nodemon
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
RUN install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
RUN apt-get update
RUN apt-get install apt-transport-https ca-certificates gnupg curl -y
RUN echo "deb https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
RUN curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
RUN apt-get update && apt-get install google-cloud-cli -y
RUN apt-get install google-cloud-sdk-gke-gcloud-auth-plugin
# Autenticação da conta
COPY config /root/.config/gcloud
# Conexão ao cluster do paas, para executar comandos no bot
RUN gcloud container clusters get-credentials gke-usc1-rd-sre-stg-01 --region us-central1 --project rd-sre-stg-01

CMD ["nodemon", "app.js"]
