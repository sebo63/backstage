/*
 * Copyright 2024 The Backstage Authors
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

import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { InputError } from '@backstage/errors';
import { createGitlabApi } from './helpers';
import { examples } from './gitlabRepoPush.examples';
import { MigrationEntityOptions } from '@gitbeaker/core';

/**
 * Create a new action that imports a gitlab repository into another gitlab repository.
 *
 * @public
 */
export const createGitlabRepoImport = (options: {
  integrations: ScmIntegrationRegistry;
}) => {
  const { integrations } = options;

  return createTemplateAction<{
    sourceRepoUrl: string; // this the source gitlab instance, from where we are going to import a repo
    sourceRepoAccessToken: string;
    targetRepoUrl: string; // this the target gitlab instance, whose API endpoint we are going to call
    targetRepoAccessToken: string;
    sourceFullPath: string;
    sourceType: string;
    destinationSlug: string;
    destinationNamespace: string;
  }>({
    id: 'gitlab:repo:import',
    examples,
    schema: {
      input: {
        required: [
          'sourceRepoUrl',
          'sourceRepoAccessToken',
          'targetRepoUrl',
          'targetRepoAccessToken',
          'sourceFullPath',
          'sourceType',
          'destinationSlug',
          'destinationNamespace',
        ],
        type: 'object',
        properties: {
          sourceRepoUrl: {
            type: 'string',
            title: 'Source Repository Location',
            description: `Accepts the format 'https://gitlab.com/'`,
          },
          sourceRepoAccessToken: {
            type: 'string',
            title: 'Source Repository Access Token',
            description: `The token to use for authorization to the source GitLab'`,
          },
          targetRepoUrl: {
            type: 'string',
            title: 'Target Repository Location',
            description: `Accepts the format 'https://gitlab.com/'`,
          },
          targetRepoAccessToken: {
            type: 'string',
            title: 'Target Repository Access Token',
            description: `The token to use for authorization to the target GitLab'`,
          },
          sourceFullPath: {
            type: 'string',
            title: 'Repository Full Path',
            description:
              'Full path to the repository in the source Gitlab instance',
          },
          sourceType: {
            type: 'string',
            title: 'Source Entity Type',
            enum: ['project_entity', 'group_entity'],
            description:
              'Can be either project_entity or group_entity (not implemented)',
          },
          destinationSlug: {
            type: 'string',
            title: 'Destination Repo Slug',
            description:
              'Slug to be used for the import repo in the target Gitlab',
          },
          destinationNamespace: {
            type: 'string',
            title: 'Target Group Name',
            description:
              'Group name under which the imported repo will be located (must exist prior to import)',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          importedRepoUrl: {
            title: 'URL to the newly imported repo',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const {
        sourceRepoUrl,
        sourceRepoAccessToken,
        targetRepoUrl,
        targetRepoAccessToken,
        sourceFullPath,
        sourceType,
        destinationSlug,
        destinationNamespace,
      } = ctx.input;

      const api = createGitlabApi({
        integrations: integrations,
        token: targetRepoAccessToken,
        repoUrl: targetRepoUrl,
      });

      // let fileRoot: string = ctx.workspacePath;

      const migrationEntity: MigrationEntityOptions[] = [
        {
          sourceType: sourceType,
          sourceFullPath: sourceFullPath,
          destinationSlug: destinationSlug,
          destinationNamespace: destinationNamespace,
        },
      ];

      const sourceConfig = {
        url: sourceRepoUrl,
        access_token: sourceRepoAccessToken,
      };

      try {
        await api.Migrations.create(sourceConfig, migrationEntity);
      } catch (e: any) {
        if (e.response?.statusCode !== 404) {
          throw new InputError(
            `Failed to transfer repo ${sourceFullPath}. Make sure that ${sourceFullPath} exists in ${sourceRepoUrl} ${e}`,
          );
        }
      }

      // ctx.output('projectid', repoID);
      // ctx.output('projectPath', repoID);
      // ctx.output('commitHash', commit.id);
    },
  });
};
