const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { expressOauth, OAuthStrategy } = require('@feathersjs/authentication-oauth');
const fetch = require('node-fetch');

const gitHubEmailApiUrl = 'https://api.github.com/user/emails';

/**
 * Retrieve the list of emails registered for a GitHub user and pick the
 * best one available. If the user's primary email is verified, that's the
 * preferred option. If that's not available, return an verified email. If no
 * verified emails exist, return any email they have.
 */
async function fetchGitHubEmail(req) {
  const resp = await fetch(gitHubEmailApiUrl, {
    headers: {
      Authorization: `${req.raw.token_type} ${req.raw.access_token}`,
    },
  });

  const emails = await resp.json();
  if (!emails || !emails.length) {
    throw new Error('Unable to retrieve emails from GitHub user profile');
  }

  let best = emails[0];
  for (const e of emails) {
    // eslint-disable-next-line no-continue
    if (!e.email) continue;
    if (e.primary && e.verified) return e.email; // Just what we want.
    if (e.verified || !best.verified) best = e;
  }

  return best.email;
}

class GitHubStrategy extends OAuthStrategy {
  async getEntityData(profile) {
    const baseData = await super.getEntityData(profile);

    return {
      ...baseData,
      // You can also set the display name to profile.name
      name: profile.login,
      // The GitHub profile image
      avatar: profile.avatar_url,
      // The user email address (if available)
      email: profile.email
    };
  }

  async getProfile(data, params) {
    const profile = await super.getProfile(data, params);
    if (!profile.email) {
      profile.email = await fetchGitHubEmail(data);
    }
    return profile;
  }
}

module.exports = app => {
  const expressSession = app.get('expressSession');
  if (!expressSession) throw new Error('Internal error: expressSession not set');

  const authentication = new AuthenticationService(app);

  authentication.register('jwt', new JWTStrategy());
  authentication.register('local', new LocalStrategy());
  authentication.register('github', new GitHubStrategy());

  app.use('/authentication', authentication);
  app.configure(expressOauth({ expressSession }));
};
