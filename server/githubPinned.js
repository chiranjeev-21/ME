const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const DEFAULT_LOGIN = 'chiranjeev-21';

const FALLBACK_ARTIFACT = {
  id: 'fallback-face-mask-detection',
  name: 'Real-Time Face-Mask Detection',
  description:
    'YOLO-based system for detecting mask offenders in real-time via camera surveillance. Published with Intellectual Property India, 2022.',
  url: 'https://drive.google.com/drive/u/1/folders/1Kzb7cPkzDbj38a8uRQgOvbUnCQTpJK8Z',
  homepageUrl: null,
  primaryLanguage: {
    name: 'Computer Vision',
    color: '#38bdf8',
  },
  stargazerCount: 0,
  forkCount: 0,
  updatedAt: '2022-01-01T00:00:00.000Z',
  topics: ['yolo', 'opencv', 'surveillance'],
};

const PINNED_REPOSITORIES_QUERY = `
  query PinnedRepositories($login: String!) {
    user(login: $login) {
      login
      name
      url
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            id
            name
            description
            url
            homepageUrl
            stargazerCount
            forkCount
            updatedAt
            isPrivate
            primaryLanguage {
              name
              color
            }
            repositoryTopics(first: 4) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=86400');
  res.end(JSON.stringify(payload));
}

function getFallbackResponse(login, message) {
  return {
    source: 'fallback',
    profile: {
      login,
      name: 'Chiranjeev Singh',
      url: `https://github.com/${login}`,
    },
    items: [FALLBACK_ARTIFACT],
    message,
  };
}

function mapRepository(repository) {
  return {
    id: repository.id,
    name: repository.name,
    description: repository.description || 'No description added yet.',
    url: repository.url,
    homepageUrl: repository.homepageUrl,
    primaryLanguage: repository.primaryLanguage
      ? {
          name: repository.primaryLanguage.name,
          color: repository.primaryLanguage.color,
        }
      : null,
    stargazerCount: repository.stargazerCount,
    forkCount: repository.forkCount,
    updatedAt: repository.updatedAt,
    topics: (repository.repositoryTopics?.nodes || [])
      .map(node => node?.topic?.name)
      .filter(Boolean),
  };
}

async function fetchPinnedRepositories(login, token) {
  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'chiranjeev-portfolio-hidden-vault',
    },
    body: JSON.stringify({
      query: PINNED_REPOSITORIES_QUERY,
      variables: { login },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with status ${response.status}.`);
  }

  const payload = await response.json();

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error(payload.errors[0].message || 'GitHub GraphQL returned an error.');
  }

  const user = payload.data?.user;

  if (!user) {
    throw new Error(`GitHub user "${login}" was not found.`);
  }

  const items = (user.pinnedItems?.nodes || [])
    .filter(repository => repository && !repository.isPrivate)
    .map(mapRepository);

  return {
    source: 'github',
    profile: {
      login: user.login,
      name: user.name,
      url: user.url,
    },
    items,
  };
}

async function handlePinnedQuestRequest(req, res, env = process.env) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const login = env.GITHUB_PROFILE_LOGIN || DEFAULT_LOGIN;
  const token = env.GITHUB_TOKEN;

  if (!token) {
    sendJson(
      res,
      200,
      getFallbackResponse(login, 'Vault sync is in fallback mode right now.')
    );
    return;
  }

  try {
    const payload = await fetchPinnedRepositories(login, token);

    if (!payload.items.length) {
      sendJson(
        res,
        200,
        getFallbackResponse(
          login,
          'No hidden artifacts were found, so the vault is showing its fallback artifact.'
        )
      );
      return;
    }

    sendJson(res, 200, payload);
  } catch (error) {
    const message = error instanceof Error
      ? 'Vault sync is temporarily unavailable, so the vault is showing its fallback artifact for now.'
      : 'Vault sync is temporarily unavailable, so the vault is showing its fallback artifact for now.';

    sendJson(res, 200, getFallbackResponse(login, message));
  }
}

module.exports = {
  DEFAULT_LOGIN,
  handlePinnedQuestRequest,
};
