// api/callback.js
const { AuthorizationCode } = require("simple-oauth2");

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

module.exports = async (req, res) => {
  const { code } = req.query;
  const options = {
    code,
  };

  try {
    const accessToken = await client.getToken(options);
    const token = accessToken.token.access_token;

    const response = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><script>window.opener.postMessage('authorization:github:success:${JSON.stringify(
      { token: token, provider: "github" }
    )}', window.location.origin);window.close();</script></body></html>`;
    res.status(200).send(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
