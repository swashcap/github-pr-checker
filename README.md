# github-pr-checker

This project is scripting around [@ocktokit/rest](https://github.com/octokit/rest.js) to output basic information about a GitHub project's pull requests.

## Use

1. Install the dependencies with [yarn](https://yarnpkg.com/en/):

    ```shell
    yarn
    ```
2. Build the project:

    ```shell
    yarn build
    ```
3. Run the CLI:

    ```shell
    ./bin/index.js owner/repository
    ```

    You can optionally add a `GH_TOKEN` env var with a GitHub auth token.

## Debugging

```shell
DEBUG=github-pr-checker ./bin/index.js
```

## GitHub API documentation

* Pull requests: https://developer.github.com/v3/pulls/
* Pull request comments: https://developer.github.com/v3/pulls/reviews/
* Issue comments (applies to pull requests, too): https://developer.github.com/v3/issues/comments/