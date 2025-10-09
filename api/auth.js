// api/auth.js
const { AuthorizationCode } = require("simple-oauth2");

// Configuração usando as variáveis de ambiente da Vercel
const config = {
  client: {
    id: process.env.GITHUB_CLIENT_ID,
    secret: process.env.GITHUB_CLIENT_SECRET,
  },
  auth: {
    tokenHost: "https://github.com",
    tokenPath: "/login/oauth/access_token",
    authorizePath: "/login/oauth/authorize",
  },
};

const client = new AuthorizationCode(config);

// Handler da Serverless Function
module.exports = (req, res) => {
  // Gera a URL de autorização do GitHub
  const authorizationUri = client.authorizeURL({
    redirect_uri: `https://${req.headers.host}/api/callback`,
    scope: "repo,user", // Escopos necessários para o Decap CMS
    state: Math.random().toString(36).substring(7),
  });

  // Redireciona o usuário para a página de login do GitHub
  res.writeHead(302, { Location: authorizationUri });
  res.end();
};
