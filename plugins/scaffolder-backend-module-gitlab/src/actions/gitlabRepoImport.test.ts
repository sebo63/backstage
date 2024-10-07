/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createRootLogger } from '@backstage/backend-common';
import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { TemplateAction } from '@backstage/plugin-scaffolder-node';
import { createGitlabRepoImport } from './gitlabRepoImport';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

// Make sure root logger is initialized ahead of FS mock
createRootLogger();

const mockGitlabClient = {
  Migrations: {
    create: jest.fn(),
  },
};

jest.mock('@gitbeaker/rest', () => ({
  Gitlab: class {
    constructor() {
      return mockGitlabClient;
    }
  },
}));

describe('createGitlabRepoImport', () => {
  let instance: TemplateAction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    const config = new ConfigReader({
      integrations: {
        gitlab: [
          {
            host: 'gitlab.com',
            token: 'token',
            apiBaseUrl: 'https://api.gitlab.com',
          },
          {
            host: 'hosted.gitlab.com',
            apiBaseUrl: 'https://api.hosted.gitlab.com',
          },
        ],
      },
    });

    const integrations = ScmIntegrations.fromConfig(config);
    instance = createGitlabRepoImport({ integrations });
  });

  describe('createGitlabRepoImport', () => {
    it('default repo import action is created', async () => {
      const input = {
        sourceRepoUrl: 'https://gitlab.remote.com',
        sourceRepoAccessToken: 'lolstoken',
        targetRepoUrl: 'gitlab.com',
        targetRepoAccessToken: 'moreLOLsToken',
        sourceFullPath: 'foo/bar/go-lang',
        sourceType: 'project_entity',
        destinationSlug: 'migrated-go-lang',
        destinationNamespace: 'migrated/foo/bar',
      };
      const ctx = createMockActionContext({ input });
      await instance.handler(ctx);

      expect(mockGitlabClient.Migrations.create).toHaveBeenCalledWith(
        {
          url: 'https://gitlab.remote.com',
          access_token: 'lolstoken',
        },
        [
          {
            sourceType: 'project_entity',
            sourceFullPath: 'foo/bar/go-lang',
            destinationSlug: 'migrated-go-lang',
            destinationNamespace: 'migrated/foo/bar',
          },
        ],
      );
    });
  });
});
