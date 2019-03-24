// eslint-disable-next-line no-unused-vars
import Octokit, { PullsListResponseItem, PullsListCommentsResponse, PullsListReviewsResponse } from '@octokit/rest'
import debug from 'debug'

const debugLog = debug('github-pr-checker')
const octokit = new Octokit({
  auth: process.env.GH_TOKEN && `token ${process.env.GH_TOKEN}`,
  log: {
    debug: (...args) => debugLog('octokit-debug', ...args),
    info: (...args) => debugLog('octokit-info', ...args),
    warn: (...args) => debugLog('octokit-warn', ...args),
    error: (...args) => debugLog('octokit-error', ...args)
  }
})

export interface PRApiResponse {
  comments: PullsListCommentsResponse
  pr: PullsListResponseItem
  reviews: PullsListReviewsResponse
}

export const gimmeData = async ({
  owner,
  page,
  per_page,
  repo
}: {
  owner: string;
  page: number,
  per_page: number,
  repo: string;
}): Promise<PRApiResponse[]> => {
  debugLog(`${owner}/${repo}`)

  const getComments = async (id: number) => octokit.pulls.listComments({
    number: id,
    owner,
    repo
  })
  const getReviews = async (id: number) => octokit.pulls.listReviews({
    number: id,
    owner,
    repo
  })
  const getPullRequests = async () => octokit.pulls.list({
    owner,
    page,
    per_page,
    repo,
    state: 'all'
  })

  // TODO: Paginate
  // TODO: Handle error codes
  const pullRequests = await getPullRequests()
  debugLog(`${owner}/${repo}: ${pullRequests.data.length} PRs`)

  return Promise.all(pullRequests.data.map(async (pr) => {
    const comments = await getComments(pr.number)
    const reviews = await getReviews(pr.number)

    debugLog(`${owner}/${repo}/pull/${pr.number}: ${comments.data.length} comments`)
    debugLog(`${owner}/${repo}/pull/${pr.number}: ${reviews.data.length} reviews`)

    return {
      comments: comments.data,
      pr,
      reviews: reviews.data
    }
  }))
}

export interface PROutput {
  author: string;
  baseBranch: string;
  hasComments: boolean;
  hasDescription: boolean;
  merged: boolean;
  isAssigned: boolean;
  reviews?: string[];
  url: string;
}

export const mapPRToOutput = (items: PRApiResponse[]): PROutput[] => items.map(({ comments, pr, reviews }) => ({
  author: pr.user.login,
  baseBranch: pr.base.ref,
  isAssigned: pr.assignee !== null || !!pr.assignees.length,
  hasComments: !!comments.length,
  hasDescription: !!pr.body,
  hasReviews: !!reviews.length,
  merged: !!pr.merged_at,
  reviews: reviews.length && reviews.some(({ state }) => state === 'APPROVED')
    ? reviews.reduce<string[]>((acc, { state, user }) => state === 'APPROVED' ? acc.concat(user.login) : acc, [])
    : undefined,
  url: pr.html_url
}))
