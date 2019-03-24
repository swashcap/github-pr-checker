#!/usr/bin/env node
import 'perish'
import meow from 'meow'
import { setFlagsFromString } from 'v8';
import { gimmeData, mapPRToOutput, PROutput } from '../src';

const cli = meow(`
  Usage
  $ github-pr-checker owner/repository

  Options
    --json  Output as JSON
`, {
  flags: {
    json: {
      type: 'boolean'
    },
  }
})

const owner = cli.input[0] ? cli.input[0].split('/')[0] : ''
const repo = cli.input[0] ? cli.input[0].split('/')[1] : ''
const { json } = cli.flags

if (!owner || !repo) {
  throw new Error('`owner/repository` arg is required')
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
  const getPercent = (n: number) => `${Math.round(n / count * 10000) / 100}%`

  // Markdown report!
  console.log(`# ${owner}/${repo} PR Report

* Pull requests: **${count}**
* No Description: **${getPercent(count - getCount(({ hasDescription }) => hasDescription))}**
* No comments: **${getPercent(count - getCount(({ hasComments }) => hasComments))}**
* No reviews: **${getPercent(count - getCount(({ hasReviews, reviewers }) => hasReviews && !!reviewers && !!reviewers.length))}**

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
`).join('\n')}`)
})
