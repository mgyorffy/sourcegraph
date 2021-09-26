import { boolean } from '@storybook/addon-knobs'
import { useMemo, useCallback } from '@storybook/addons'
import { storiesOf } from '@storybook/react'
import { subDays } from 'date-fns'
import React from 'react'
import { of } from 'rxjs'
import { MATCH_ANY_PARAMETERS, WildcardMockLink } from 'wildcard-mock-link'

import { getDocumentNode } from '@sourcegraph/shared/src/graphql/apollo'
import { MockedTestProvider } from '@sourcegraph/shared/src/testing/apollo'

import {
    BatchChangeByNamespaceResult,
    BatchChangeFields,
    BulkOperationState,
    BulkOperationType,
    ChangesetCheckState,
    ChangesetReviewState,
    ChangesetSpecType,
    ChangesetState,
} from '../../../graphql-operations'
import { EnterpriseWebStory } from '../../components/EnterpriseWebStory'

import {
    queryChangesets as _queryChangesets,
    queryExternalChangesetWithFileDiffs,
    queryChangesetCountsOverTime as _queryChangesetCountsOverTime,
    queryBulkOperations as _queryBulkOperations,
    queryAllChangesetIDs as _queryAllChangesetIDs,
    BATCH_CHANGE_BY_NAMESPACE,
} from './backend'
import { BatchChangeDetailsPage } from './BatchChangeDetailsPage'
import { MOCK_BATCH_CHANGE } from './BatchChangeDetailsPage.mock'

const { add } = storiesOf('web/batches/details/BatchChangeDetailsPage', module)
    .addDecorator(story => <div className="p-3 container">{story()}</div>)
    .addParameters({
        chromatic: {
            viewports: [320, 576, 978, 1440],
        },
    })

const now = new Date()

const queryChangesets: typeof _queryChangesets = () =>
    of({
        pageInfo: {
            endCursor: null,
            hasNextPage: false,
        },
        totalCount: 6,
        nodes: [
            {
                __typename: 'HiddenExternalChangeset',
                createdAt: subDays(now, 5).toISOString(),
                state: ChangesetState.UNPUBLISHED,
                id: 'someh1',
                nextSyncAt: null,
                updatedAt: subDays(now, 5).toISOString(),
            },
            {
                __typename: 'HiddenExternalChangeset',
                createdAt: subDays(now, 5).toISOString(),
                state: ChangesetState.PROCESSING,
                id: 'someh2',
                nextSyncAt: null,
                updatedAt: subDays(now, 5).toISOString(),
            },
            {
                __typename: 'HiddenExternalChangeset',
                createdAt: subDays(now, 5).toISOString(),
                state: ChangesetState.RETRYING,
                id: 'someh3',
                nextSyncAt: null,
                updatedAt: subDays(now, 5).toISOString(),
            },
            {
                __typename: 'HiddenExternalChangeset',
                createdAt: subDays(now, 5).toISOString(),
                state: ChangesetState.FAILED,
                id: 'someh5',
                nextSyncAt: null,
                updatedAt: subDays(now, 5).toISOString(),
            },
            {
                __typename: 'HiddenExternalChangeset',
                createdAt: subDays(now, 5).toISOString(),
                state: ChangesetState.OPEN,
                id: 'someh4',
                nextSyncAt: null,
                updatedAt: subDays(now, 5).toISOString(),
            },
            {
                __typename: 'ExternalChangeset',
                body: 'body',
                checkState: ChangesetCheckState.PASSED,
                diffStat: {
                    __typename: 'DiffStat',
                    added: 10,
                    changed: 9,
                    deleted: 1,
                },
                externalID: '123',
                externalURL: {
                    url: 'http://test.test/123',
                },
                labels: [{ color: '93ba13', description: 'Very awesome description', text: 'Some label' }],
                repository: {
                    id: 'repoid',
                    name: 'github.com/sourcegraph/awesome',
                    url: 'http://test.test/awesome',
                },
                reviewState: ChangesetReviewState.COMMENTED,
                title: 'Add prettier to all projects',
                createdAt: subDays(now, 5).toISOString(),
                updatedAt: subDays(now, 5).toISOString(),
                state: ChangesetState.OPEN,
                nextSyncAt: null,
                id: 'somev1',
                error: null,
                syncerError: null,
                currentSpec: {
                    id: 'spec-rand-id-1',
                    type: ChangesetSpecType.BRANCH,
                    description: {
                        __typename: 'GitBranchChangesetDescription',
                        headRef: 'my-branch',
                    },
                },
            },
            {
                __typename: 'ExternalChangeset',
                body: 'body',
                checkState: null,
                diffStat: {
                    __typename: 'DiffStat',
                    added: 10,
                    changed: 9,
                    deleted: 1,
                },
                externalID: null,
                externalURL: null,
                labels: [],
                repository: {
                    id: 'repoid',
                    name: 'github.com/sourcegraph/awesome',
                    url: 'http://test.test/awesome',
                },
                reviewState: null,
                title: 'Add prettier to all projects',
                createdAt: subDays(now, 5).toISOString(),
                updatedAt: subDays(now, 5).toISOString(),
                state: ChangesetState.RETRYING,
                nextSyncAt: null,
                id: 'somev2',
                error: 'Cannot create PR, insufficient token scope.',
                syncerError: null,
                currentSpec: {
                    id: 'spec-rand-id-2',
                    type: ChangesetSpecType.BRANCH,
                    description: {
                        __typename: 'GitBranchChangesetDescription',
                        headRef: 'my-branch',
                    },
                },
            },
        ],
    })

const queryAllChangesetIDs: typeof _queryAllChangesetIDs = () => of(['somev1', 'somev2'])

const queryEmptyExternalChangesetWithFileDiffs: typeof queryExternalChangesetWithFileDiffs = () =>
    of({
        diff: {
            __typename: 'PreviewRepositoryComparison',
            fileDiffs: {
                nodes: [],
                totalCount: 0,
                pageInfo: {
                    endCursor: null,
                    hasNextPage: false,
                },
            },
        },
    })

const queryBulkOperations: typeof _queryBulkOperations = () =>
    of({
        totalCount: 3,
        pageInfo: {
            endCursor: null,
            hasNextPage: false,
        },
        nodes: [
            {
                id: 'id1',
                type: BulkOperationType.COMMENT,
                state: BulkOperationState.PROCESSING,
                errors: [],
                progress: 0.25,
                createdAt: subDays(now, 5).toISOString(),
                finishedAt: null,
                changesetCount: 100,
                initiator: {
                    url: '/users/alice',
                    username: 'alice',
                },
            },
            {
                id: 'id2',
                type: BulkOperationType.COMMENT,
                state: BulkOperationState.COMPLETED,
                errors: [],
                progress: 1,
                createdAt: subDays(now, 5).toISOString(),
                finishedAt: subDays(now, 4).toISOString(),
                changesetCount: 100,
                initiator: {
                    url: '/users/alice',
                    username: 'alice',
                },
            },
            {
                id: 'id3',
                type: BulkOperationType.DETACH,
                state: BulkOperationState.COMPLETED,
                errors: [],
                progress: 1,
                createdAt: subDays(now, 5).toISOString(),
                finishedAt: subDays(now, 4).toISOString(),
                changesetCount: 25,
                initiator: {
                    url: '/users/alice',
                    username: 'alice',
                },
            },
            {
                id: 'id4',
                type: BulkOperationType.COMMENT,
                state: BulkOperationState.FAILED,
                errors: [
                    {
                        changeset: {
                            __typename: 'ExternalChangeset',
                            externalURL: {
                                url: 'https://test.test/my/pr',
                            },
                            repository: {
                                name: 'sourcegraph/sourcegraph',
                                url: '/github.com/sourcegraph/sourcegraph',
                            },
                            title: 'Changeset title on code host',
                        },
                        error: 'Failed to create comment, cannot comment on a PR that is awesome.',
                    },
                ],
                progress: 1,
                createdAt: subDays(now, 5).toISOString(),
                finishedAt: subDays(now, 4).toISOString(),
                changesetCount: 100,
                initiator: {
                    url: '/users/alice',
                    username: 'alice',
                },
            },
        ],
    })

const queryChangesetCountsOverTime: typeof _queryChangesetCountsOverTime = () =>
    of([
        {
            date: subDays(new Date('2020-08-10'), 5).toISOString(),
            closed: 0,
            merged: 0,
            openPending: 5,
            total: 10,
            draft: 5,
            openChangesRequested: 0,
            openApproved: 0,
        },
        {
            date: subDays(new Date('2020-08-10'), 4).toISOString(),
            closed: 0,
            merged: 0,
            openPending: 4,
            total: 10,
            draft: 3,
            openChangesRequested: 0,
            openApproved: 3,
        },
        {
            date: subDays(new Date('2020-08-10'), 3).toISOString(),
            closed: 0,
            merged: 2,
            openPending: 5,
            total: 10,
            draft: 0,
            openChangesRequested: 0,
            openApproved: 3,
        },
        {
            date: subDays(new Date('2020-08-10'), 2).toISOString(),
            closed: 0,
            merged: 3,
            openPending: 3,
            total: 10,
            draft: 0,
            openChangesRequested: 1,
            openApproved: 3,
        },
        {
            date: subDays(new Date('2020-08-10'), 1).toISOString(),
            closed: 1,
            merged: 5,
            openPending: 2,
            total: 10,
            draft: 0,
            openChangesRequested: 0,
            openApproved: 2,
        },
        {
            date: new Date('2020-08-10').toISOString(),
            closed: 1,
            merged: 5,
            openPending: 0,
            total: 10,
            draft: 0,
            openChangesRequested: 0,
            openApproved: 4,
        },
    ])

const deleteBatchChange = () => Promise.resolve(undefined)

const stories: Record<string, { url: string; supersededBatchSpec?: boolean }> = {
    Overview: { url: '/users/alice/batch-changes/awesome-batch-change' },
    'Burndown chart': { url: '/users/alice/batch-changes/awesome-batch-change?tab=chart' },
    'Spec file': { url: '/users/alice/batch-changes/awesome-batch-change?tab=spec' },
    Archived: { url: '/users/alice/batch-changes/awesome-batch-change?tab=archived' },
    'Bulk operations': { url: '/users/alice/batch-changes/awesome-batch-change?tab=bulkoperations' },
    'Superseded batch-spec': { url: '/users/alice/batch-changes/awesome-batch-change', supersededBatchSpec: true },
}

for (const [name, { url, supersededBatchSpec }] of Object.entries(stories)) {
    add(name, () => {
        const supersedingBatchSpec = boolean('supersedingBatchSpec', !!supersededBatchSpec)
        const viewerCanAdminister = boolean('viewerCanAdminister', true)
        const isClosed = boolean('isClosed', false)
        const batchChange: BatchChangeFields = useMemo(
            () => ({
                ...MOCK_BATCH_CHANGE,
                currentSpec: {
                    ...MOCK_BATCH_CHANGE.currentSpec,
                    supersedingBatchSpec: supersedingBatchSpec
                        ? {
                              createdAt: subDays(new Date(), 1).toISOString(),
                              applyURL: '/users/alice/batch-changes/apply/newspecid',
                          }
                        : null,
                },
                viewerCanAdminister,
                closedAt: isClosed ? subDays(now, 1).toISOString() : null,
            }),
            [supersedingBatchSpec, viewerCanAdminister, isClosed]
        )

        const data: BatchChangeByNamespaceResult = { batchChange }

        const mocks = new WildcardMockLink([
            {
                request: {
                    query: getDocumentNode(BATCH_CHANGE_BY_NAMESPACE),
                    variables: MATCH_ANY_PARAMETERS,
                },
                result: { data },
                nMatches: Number.POSITIVE_INFINITY,
            },
        ])

        return (
            <EnterpriseWebStory initialEntries={[url]}>
                {props => (
                    <MockedTestProvider link={mocks}>
                        <BatchChangeDetailsPage
                            {...props}
                            namespaceID="namespace123"
                            batchChangeName="awesome-batch-change"
                            queryChangesets={queryChangesets}
                            queryChangesetCountsOverTime={queryChangesetCountsOverTime}
                            queryExternalChangesetWithFileDiffs={queryEmptyExternalChangesetWithFileDiffs}
                            deleteBatchChange={deleteBatchChange}
                            queryBulkOperations={queryBulkOperations}
                            queryAllChangesetIDs={queryAllChangesetIDs}
                            extensionsController={{} as any}
                            platformContext={{} as any}
                        />
                    </MockedTestProvider>
                )}
            </EnterpriseWebStory>
        )
    })
}

add('Empty changesets', () => {
    const mocks = new WildcardMockLink([
        {
            request: {
                query: getDocumentNode(BATCH_CHANGE_BY_NAMESPACE),
                variables: MATCH_ANY_PARAMETERS,
            },
            result: { data: { batchChange: MOCK_BATCH_CHANGE } },
            nMatches: Number.POSITIVE_INFINITY,
        },
    ])

    const queryEmptyChangesets = useCallback(
        () =>
            of({
                pageInfo: {
                    endCursor: null,
                    hasNextPage: false,
                },
                totalCount: 0,
                nodes: [],
            }),
        []
    )
    return (
        <EnterpriseWebStory>
            {props => (
                <MockedTestProvider link={mocks}>
                    <BatchChangeDetailsPage
                        {...props}
                        namespaceID="namespace123"
                        batchChangeName="awesome-batch-change"
                        queryChangesets={queryEmptyChangesets}
                        queryChangesetCountsOverTime={queryChangesetCountsOverTime}
                        queryExternalChangesetWithFileDiffs={queryEmptyExternalChangesetWithFileDiffs}
                        deleteBatchChange={deleteBatchChange}
                        extensionsController={{} as any}
                        platformContext={{} as any}
                    />
                </MockedTestProvider>
            )}
        </EnterpriseWebStory>
    )
})
