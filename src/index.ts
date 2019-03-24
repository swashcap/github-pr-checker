// eslint-disable-next-line no-unused-vars
import Octokit, { PullsListResponseItem, PullsListCommentsResponse, PullsListReviewsResponse } from '@octokit/rest'

const octokit = new Octokit()

interface PRApiResponse {
  comments: PullsListCommentsResponse
  pr: PullsListResponseItem
  reviews: PullsListReviewsResponse
}

export const gimmeData = async ({
  owner,
  repo
}: {
  owner: string;
  repo: string;
}): Promise<PRApiResponse[]> => {
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
  const getPullRequests = async (page: number) => octokit.pulls.list({
    owner,
    page,
    per_page: 10,
    repo,
    state: 'all'
  })

  // TODO: Paginate
  // TODO: Handle error codes
  const pullRequests = await getPullRequests(1)

  return Promise.all(pullRequests.data.map(async (pr) => {
    const comments = await getComments(pr.number)
    const reviews = await getReviews(pr.number)
    return {
      comments: comments.data,
      pr,
      reviews: reviews.data
    }
  }))
}

interface PROutput {
  author: string;
  baseBranch: string;
  hasComments: boolean;
  hasDescription: boolean;
  hasReviews: boolean;
  merged: boolean;
  isAssigned: boolean;
  reviewers?: string[];
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
  reviewers: pr.requested_reviewers.length ? pr.requested_reviewers.map(({ login }) => login) : undefined,
  url: pr.html_url
}))
