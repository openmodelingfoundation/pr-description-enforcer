const core = require('@actions/core');
const github = require('@actions/github');

const PR_TEMPLATE_PATHS = [
  'PULL_REQUEST_TEMPLATE.md',
  'pull_request_template.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/pull_request_template.md',
  'docs/PULL_REQUEST_TEMPLATE.md',
  'docs/pull_request_template.md',
  'PULL_REQUEST_TEMPLATE.txt',
  'pull_request_template.txt',
  '.github/PULL_REQUEST_TEMPLATE.txt',
  '.github/pull_request_template.txt',
  'docs/PULL_REQUEST_TEMPLATE.txt',
  'docs/pull_request_template.txt',
  'PULL_REQUEST_TEMPLATE',
  'pull_request_template',
  '.github/PULL_REQUEST_TEMPLATE',
  '.github/pull_request_template',
  'docs/PULL_REQUEST_TEMPLATE',
  'docs/pull_request_template',
]

const getPrNumber = () => {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }
  return pullRequest.number;
}

const getPrDescription = async (client) => {
  const prNumber = getPrNumber();
  if (!prNumber) {
    core.error("Could not get pull request number from context, exiting");
    return;
  }
  const { data: pullRequest } = await client.pulls.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
  });

  return pullRequest.body && pullRequest.body.trim()
}

const getPrTemplate = async (client, paths) => {
  const prTemplatePath = paths.shift();

  core.info(`trying pr template path: ${prTemplatePath}`);

  try {
    const {data} = await client.repos.getContent({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      prTemplatePath,
    });
    core.info(`pr template (${prTemplatePath}) content: ${JSON.stringify(data)}`);

    return prTemplateContents.trim();
  } catch (error) {
    if (!paths.length) {
      return undefined
    }
    return getPrTemplate(client, paths)
  }
}

// most @actions toolkit packages have async methods
async function run() {
  try {
    const token = core.getInput("repo-token", { required: true });

    const client = github.getOctokit(token)

    const prDescription = await getPrDescription(client)
    const prTemplate = await getPrTemplate(client, PR_TEMPLATE_PATHS)

    if (!prDescription || prDescription === prTemplate) {
      core.setFailed('PR description missing');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
