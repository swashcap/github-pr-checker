#!/usr/bin/env node
import 'perish'
import meow from 'meow'
import { gimmeData, mapPRToOutput, PROutput } from '../src';

const cli = meow(`
  Usage
  $ github-pr-checker owner/repository

  Options
    --json     Output as JSON
    --page     Page offset (defaults to 1)
    --perPage  Results per page (defaults to 10)
`, {
  flags: {
    page: {
      type: 'string'
    },
    perPage: {
      type: 'string'
    },
    json: {
      type: 'boolean'
    },
  }
})

const owner = cli.input[0] ? cli.input[0].split('/')[0] : ''
const repo = cli.input[0] ? cli.input[0].split('/')[1] : ''
const page = cli.flags.page ? parseInt(cli.flags.page) : 1
const perPage = cli.flags.perPage ? parseInt(cli.flags.perPage) : 10

if (!owner || !repo) {
  throw new Error('`owner/repository` arg is required')
} else if (Number.isNaN(page) || page < 1) {
  throw new Error('Bad `page` flag')
} else if (Number.isNaN(perPage) || perPage < 1) {
  throw new Error('Bad `perPage` flag')
}

gimmeData({
  owner,
  page,
  perPage,
  repo
}).then(data => {
  const output = mapPRToOutput(data)

  if (cli.flags.json) {
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
* No reviews: **${getPercent(count - getCount(({ reviews }) => !!reviews))}**

${output.map(({
  author,
  baseBranch,
  hasComments,
  hasDescription,
  isAssigned,
  merged,
  reviews,
  url
}) => `## ${url}

* Author: **${author}**
* Branch: **${baseBranch}**
* Has comments?: **${hasComments}**
* Has description?: **${hasDescription}**
* Reviews?: **${reviews ? reviews.join(', ') : false}**
* Is assigned?: **${isAssigned}**
* Merged?: **${merged}**
`).join('\n')}`)
})
