import 'perish'
import meow from 'meow'
import { setFlagsFromString } from 'v8';
import { gimmeData, mapPRToOutput, PROutput } from '../src';

const cli = meow(`
  Usage
  $ github-pr-checker --owner swashcap --repo github-pr-checker

  Options
    --owner, -o  Repository owner (required)
    --repo, -r   Repository name (required)
    --json       Output as JSON
`, {
  flags: {
    json: {
      type: 'boolean'
    },
    owner: {
      alias: 'o',
      type: 'string',
    },
    repo: {
      alias: 'r',
      type: 'string',
    }
  }
})

const { json, owner, repo } = cli.flags

if (!owner && repo) {
  throw new Error('`owner` and `repo` flags ar required')
} else if (!owner) {
  throw new Error('`owner` flag is required')
} else if (!repo) {
  throw new Error('`repo` flag is required')
}


gimmeData({
  owner,
  repo
}).then(data => {
  const output = mapPRToOutput(data)

  if (json) {
    return console.log(JSON.stringify(output, undefined, 2))
  }

  const count = output.length;
  const getCount = (fn: (x: PROutput) => boolean): number =>
    output.reduce((acc, x) => fn(x) ? acc + 1 : acc, 0)
  const getPercent = (n: number) => `${Math.round(n / count * 100) / 100}%`

  // Markdown report!
  return `# ${owner}/${repo}

* Pull requests: **${count}**
* No Description: **${getPercent(getCount(({ hasDescription }) => hasDescription))}**
* No comments: **${getPercent(getCount(({ hasComments }) => hasComments))}**
* No reviews: **${getPercent(getCount(({ hasReviews, reviewers }) => hasReviews && !!reviewers && !!reviewers.length))}**

${output.map(({
  author,
  baseBranch,
  hasComments,
  hasDescription,
  hasReviews,
  isAssigned,
  merged,
  reviewers,
  url
}) => `## ${url}

* Author: **${author}**
* Branch: **${baseBranch}**
* Has comments?: **${hasComments}**
* Has description?: **${hasDescription}**
* Has reviews?: **${hasReviews && reviewers  ? reviewers.join(' ') : false}**
* Is assigned?: **${isAssigned}**
* Merged?: **${merged}**

`)}`
})
