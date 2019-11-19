import { inject, injectable } from 'inversify';
import { ProjectIssueBrowserService as ContentRepositoryBrowserService } from '../model';
import { GitHubPullRequestState } from '../services/git/IGitHubService';
import { Types } from '../types';
import { ListGetterOptions } from './common/ListGetterOptions';
import { ICollaborationInspector } from './ICollaborationInspector';
import { BitbucketPullRequestState } from '../services/git/ICVSService';

@injectable()
export class CollaborationInspector implements ICollaborationInspector {
  private service: ContentRepositoryBrowserService;

  constructor(@inject(Types.IContentRepositoryBrowser) service: ContentRepositoryBrowserService) {
    this.service = service;
  }

  async getPullRequests(
    owner: string,
    repo: string,
    options?: ListGetterOptions<{ state?: GitHubPullRequestState | BitbucketPullRequestState }>,
  ) {
    return this.service.getPullRequests(owner, repo, options);
  }

  async getPullRequest(owner: string, repo: string, prNumber: number) {
    return this.service.getPullRequest(owner, repo, prNumber);
  }

  async getPullRequestFiles(owner: string, repo: string, prNumber: number) {
    return this.service.getPullRequestFiles(owner, repo, prNumber);
  }

  async getPullCommits(owner: string, repo: string, prNumber: number) {
    return this.service.getPullCommits(owner, repo, prNumber);
  }
}
