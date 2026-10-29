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
  res.setHeader(
    'Cache-Control',
    statusCode !== 200
      ? 'no-store'
      : payload.source === 'fallback'
        ? 's-maxage=60, stale-while-revalidate=300'
        : 's-maxage=900, stale-while-revalidate=86400'
  );
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
    homepageUrl: isPublicUrl(repository.homepageUrl) ? repository.homepageUrl : null,
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
    signal: AbortSignal.timeout(6000),
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
    .filter(repository => repository && !repository.isPrivate && isPublicUrl(repository.url))
    .map(mapRepository);

  return {
    source: 'github',
    selection: 'pinned',
    profile: {
      login: user.login,
      name: user.name,
      url: user.url,
    },
    items,
  };
}

function isPublicUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

async function fetchRecentRepositories(login) {
  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(login)}/repos?type=owner&sort=updated&per_page=18`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'chiranjeev-portfolio-hidden-vault',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(6000),
    }
  );

  if (!response.ok) {
    throw new Error('Public repository sync unavailable.');
  }

  const repositories = await response.json();

  if (!Array.isArray(repositories)) {
    throw new Error('Invalid public repository response.');
  }

  const items = repositories
    .filter(
      repository =>
        repository && !repository.private && !repository.fork && isPublicUrl(repository.html_url)
    )
    .slice(0, 6)
    .map(repository => ({
      id: String(repository.id),
      name: repository.name,
      description: repository.description || 'An experiment from my open-source workbench.',
      url: repository.html_url,
      homepageUrl: isPublicUrl(repository.homepage) ? repository.homepage : null,
      primaryLanguage: repository.language ? { name: repository.language, color: null } : null,
      stargazerCount: repository.stargazers_count || 0,
      forkCount: repository.forks_count || 0,
      updatedAt: repository.updated_at,
      topics: Array.isArray(repository.topics) ? repository.topics.slice(0, 4) : [],
    }));

  return {
    source: 'github',
    selection: 'recent',
    profile: { login, name: null, url: `https://github.com/${login}` },
    items,
    message:
      'Recent public repositories. Exact profile pins are available when pinned sync is configured.',
  };
}

async function handlePinnedQuestRequest(req, res, env = process.env) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const login = (env.GITHUB_PROFILE_LOGIN || DEFAULT_LOGIN).trim();
  const token = env.GITHUB_TOKEN?.trim();

  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(login)) {
    sendJson(
      res,
      200,
      getFallbackResponse(
        DEFAULT_LOGIN,
        'Profile sync is not configured correctly. Showing a local artifact.'
      )
    );
    return;
  }

  if (token) {
    try {
      const payload = await fetchPinnedRepositories(login, token);
      if (payload.items.length) {
        sendJson(res, 200, payload);
        return;
      }
    } catch {
      // Public REST keeps the vault useful if pinned credentials expire.
    }
  }

  try {
    const payload = await fetchRecentRepositories(login);
    sendJson(
      res,
      200,
      payload.items.length
        ? payload
        : getFallbackResponse(
            login,
            'No public repositories found. Here is a local artifact instead.'
          )
    );
  } catch {
    sendJson(
      res,
      200,
      getFallbackResponse(
        login,
        'GitHub is taking a breather. Showing a local artifact; your next visit will try live sync again.'
      )
    );
  }
}

module.exports = {
  DEFAULT_LOGIN,
  handlePinnedQuestRequest,
};
