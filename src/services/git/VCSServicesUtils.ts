import _ from 'lodash';
import qs from 'qs';
import { IssueState } from '../../inspectors';
import { PullRequestState } from '../../inspectors/ICollaborationInspector';
import { BitbucketIssueState, BitbucketPullRequestState } from '../bitbucket/IBitbucketService';
import { GitHubIssueState, GitHubPullRequestState } from './IGitHubService';
import { GitLabPullRequestState, GitLabIssueState } from '../gitlab/IGitLabService';

export class VCSServicesUtils {
  static getGithubPRState = (state: PullRequestState | undefined) => {
    switch (state) {
      case PullRequestState.open:
        return GitHubPullRequestState.open;
      case PullRequestState.closed:
        return GitHubPullRequestState.closed;
      case PullRequestState.all:
        return GitHubPullRequestState.all;
      default:
        return undefined;
    }
  };

  static getBitbucketPRState = (state: PullRequestState | undefined) => {
    switch (state) {
      case PullRequestState.open:
        return BitbucketPullRequestState.open;
      case PullRequestState.closed:
        return BitbucketPullRequestState.closed;
      case PullRequestState.all:
        return [BitbucketPullRequestState.open, BitbucketPullRequestState.closed, BitbucketPullRequestState.declined];
      default:
        return undefined;
    }
  };

  static getGitLabPRState = (state: PullRequestState | undefined) => {
    switch (state) {
      case PullRequestState.open:
        return GitLabPullRequestState.open;
      case PullRequestState.closed:
        return [GitLabPullRequestState.closed, GitLabPullRequestState.merged];
      case PullRequestState.all:
        return GitLabPullRequestState.all;
      default:
        return undefined;
    }
  };

  static getGitLabIssueState = (state: IssueState | undefined) => {
    switch (state) {
      case IssueState.open:
        return GitLabIssueState.open;
      case IssueState.closed:
        return GitLabIssueState.closed;
      case IssueState.all:
        return GitLabIssueState.all;
      default:
        return undefined;
    }
  };

  static getGithubIssueState = (state: IssueState | undefined) => {
    switch (state) {
      case IssueState.open:
        return GitHubIssueState.open;
      case IssueState.closed:
        return GitHubIssueState.closed;
      case IssueState.all:
        return GitHubIssueState.all;
      default:
        return undefined;
    }
  };

  static getBitbucketIssueState = (state: IssueState | undefined) => {
    switch (state) {
      case IssueState.open:
        return BitbucketIssueState.new;
      case IssueState.closed:
        return BitbucketIssueState.resolved;
      case IssueState.all:
        return [BitbucketIssueState.new, BitbucketIssueState.resolved, BitbucketIssueState.closed];
      default:
        return undefined;
    }
  };

  static getBitbucketStateQueryParam = (state: BitbucketIssueState | BitbucketIssueState[] | undefined) => {
    if (!state) {
      return;
    }
    // put state in quotation marks because of Bitbucket API https://developer.atlassian.com/bitbucket/api/2/reference/meta/filtering#query-issues
    let quotedState: string | string[] = `"${state}"`;
    if (_.isArray(state)) {
      quotedState = state.map((state) => {
        return `"${state}"`;
      });
    }

    // get q parameter
    return qs.stringify(
      { state: quotedState },
      {
        addQueryPrefix: false,
        encode: false,
        arrayFormat: 'repeat',
        delimiter: '+OR+',
      },
    );
  };

  static parseLinkHeader = (link: string | undefined): ParsedGitHubLinkHeader | undefined => {
    if (!link) {
      return undefined;
    }

    let page: number,
      perPage: number,
      query: string | undefined,
      currentPage: number | undefined,
      parsedLinks: ParsedGitHubLinkHeader | undefined;

    const links = link.split(',');

    links.forEach((link) => {
      const iterator = linkGenerator();
      let current = iterator.next();

      // iterate with prev, next, last through one link
      while (!current.done) {
        const val = link.match(current.value.link);

        if (val) {
          // get url without brackets
          const values = val['input']?.match(/\s*<?([^>]*)>(.*)/);
          const url = values ? values[1] : undefined;

          // save url to the right key (prev, next or last)
          let parsedLink: any = { [current.value.link]: url };

          // get query string
          query = url ? url.split('?')[1] : undefined;
          if (query) {
            // parse query to get params
            const queryParams = qs.parse(query);

            page = queryParams['page'];
            perPage = queryParams['per_page'];
          }

          // get current page
          if (current.value.link === 'next') {
            currentPage = page ? page - 1 : page;
          }

          if (current.value.link === 'prev') {
            currentPage = page ? page + 1 : page;
          }

          // get max totalCount and save every needed param
          if (current.value.link === 'last') {
            //Requests that return multiple items will be paginated to 30 items by default. https://developer.github.com/v3/#pagination
            parsedLink = { totalCount: page * perPage, page: currentPage || 1, perPage: perPage || 30, ...parsedLink };
          }

          parsedLinks = { ...parsedLink, ...parsedLinks };
        }
        current = iterator.next();
      }
    });
    return parsedLinks;
  };
}

const linkGenerator = function*(): Generator<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  link: string;
}> {
  yield { link: 'prev' };
  yield { link: 'next' };
  yield { link: 'last' };

  return;
};

interface ParsedGitHubLinkHeader {
  prev?: string | null;
  next?: string | null;
  page: number;
  perPage: number;
  totalCount: number;
}
