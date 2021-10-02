import classNames from 'classnames'
import * as H from 'history'
import { isEqual } from 'lodash'
import React, { useCallback, useMemo, useState } from 'react'
import { Observable } from 'rxjs'
import { mergeMap, startWith, catchError, tap, filter } from 'rxjs/operators'

import { Form } from '@sourcegraph/branded/src/components/Form'
import { Toggle } from '@sourcegraph/branded/src/components/Toggle'
import { asError, isErrorLike } from '@sourcegraph/shared/src/util/errors'
import { useEventObservable } from '@sourcegraph/shared/src/util/useObservable'
import { Container } from '@sourcegraph/wildcard'

import { AuthenticatedUser } from '../../../auth'
import { CodeMonitorFields } from '../../../graphql-operations'
import { deleteCodeMonitor as _deleteCodeMonitor } from '../backend'

import styles from './CodeMonitorForm.module.scss'
import { DeleteMonitorModal } from './DeleteMonitorModal'
import { FormActionArea } from './FormActionArea'
import { FormTriggerArea } from './FormTriggerArea'

export interface CodeMonitorFormProps {
    history: H.History
    location: H.Location
    authenticatedUser: AuthenticatedUser
    /**
     * A function that takes in a code monitor and emits an Observable with all or some
     * of the CodeMonitorFields when the form is submitted.
     */
    onSubmit: (codeMonitor: CodeMonitorFields) => Observable<Partial<CodeMonitorFields>>
    /* The text for the submit button. */
    submitButtonLabel: string
    /* A code monitor to initialize the form with. */
    codeMonitor?: CodeMonitorFields
    /* Whether to show the delete button */
    showDeleteButton?: boolean
    /* Optional trigger query to pre-populate the trigger form */
    triggerQuery?: string
    /* Optional description to pre-populate the name */
    description?: string

    deleteCodeMonitor?: typeof _deleteCodeMonitor
}

interface FormCompletionSteps {
    triggerCompleted: boolean
    actionCompleted: boolean
}

export const CodeMonitorForm: React.FunctionComponent<CodeMonitorFormProps> = ({
    authenticatedUser,
    onSubmit,
    history,
    submitButtonLabel,
    codeMonitor,
    showDeleteButton,
    deleteCodeMonitor = _deleteCodeMonitor,
    triggerQuery,
    description,
}) => {
    const LOADING = 'loading' as const

    const [currentCodeMonitorState, setCodeMonitor] = useState<CodeMonitorFields>(
        codeMonitor ?? {
            id: '',
            description: description ?? '',
            enabled: true,
            trigger: { id: '', query: triggerQuery ?? '' },
            actions: {
                nodes: [],
            },
        }
    )

    const [formCompletion, setFormCompletion] = useState<FormCompletionSteps>({
        triggerCompleted: currentCodeMonitorState.trigger.query.length > 0,
        actionCompleted: currentCodeMonitorState.actions.nodes.length > 0,
    })
    const setTriggerCompleted = useCallback((complete: boolean) => {
        setFormCompletion(previousState => ({ ...previousState, triggerCompleted: complete }))
    }, [])
    const setActionsCompleted = useCallback((complete: boolean) => {
        setFormCompletion(previousState => ({ ...previousState, actionCompleted: complete }))
    }, [])

    const onNameChange = useCallback(
        (description: string): void => setCodeMonitor(codeMonitor => ({ ...codeMonitor, description })),
        []
    )
    const onQueryChange = useCallback(
        (query: string): void =>
            setCodeMonitor(codeMonitor => ({ ...codeMonitor, trigger: { ...codeMonitor.trigger, query } })),
        []
    )
    const onEnabledChange = useCallback(
        (enabled: boolean): void => setCodeMonitor(codeMonitor => ({ ...codeMonitor, enabled })),
        []
    )
    const onActionsChange = useCallback(
        (actions: CodeMonitorFields['actions']): void => setCodeMonitor(codeMonitor => ({ ...codeMonitor, actions })),
        []
    )

    const [requestOnSubmit, codeMonitorOrError] = useEventObservable(
        useCallback(
            (submit: Observable<React.FormEvent<HTMLFormElement>>) =>
                submit.pipe(
                    tap(event => event.preventDefault()),
                    filter(() => formCompletion.actionCompleted && formCompletion.triggerCompleted),
                    mergeMap(() =>
                        onSubmit(currentCodeMonitorState).pipe(
                            startWith(LOADING),
                            catchError(error => [asError(error)]),
                            tap(successOrError => {
                                if (!isErrorLike(successOrError) && successOrError !== LOADING) {
                                    history.push('/code-monitoring')
                                }
                            })
                        )
                    )
                ),
            [onSubmit, currentCodeMonitorState, history, formCompletion]
        )
    )

    const initialCodeMonitor = useMemo(() => codeMonitor, [codeMonitor])

    // Determine whether the form has changed. If there was no intial state (i.e. we're creating a monitor), always return
    // true.
    const hasChangedFields = useMemo(
        () => (codeMonitor ? !isEqual(initialCodeMonitor, currentCodeMonitorState) : true),
        [initialCodeMonitor, codeMonitor, currentCodeMonitorState]
    )

    const onCancel = useCallback(() => {
        if (hasChangedFields) {
            if (window.confirm('Leave page? All unsaved changes will be lost.')) {
                history.push('/code-monitoring')
            }
        } else {
            history.push('/code-monitoring')
        }
    }, [history, hasChangedFields])

    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const toggleDeleteModal = useCallback(() => setShowDeleteModal(show => !show), [setShowDeleteModal])

    return (
        <>
            <Form className="my-4 pb-5 test-monitor-form" onSubmit={requestOnSubmit}>
                <Container className="mb-3">
                    <div className="form-group">
                        <label htmlFor="code-monitor-form-name">Name</label>
                        <input
                            id="code-monitor-form-name"
                            type="text"
                            className="form-control mb-2 test-name-input"
                            required={true}
                            onChange={event => {
                                onNameChange(event.target.value)
                            }}
                            value={currentCodeMonitorState.description}
                            autoFocus={true}
                            spellCheck={false}
                        />
                        <small className="text-muted">
                            Give it a short, descriptive name to reference events on Sourcegraph and in notifications.
                            Do not include{' '}
                            <a
                                href="https://docs.sourcegraph.com/code_monitoring/explanations/best_practices#do-not-include-confidential-information-in-monitor-names"
                                target="_blank"
                                rel="noopener"
                            >
                                confidential information
                            </a>
                            .
                        </small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="code-monitor-form-owner">Owner</label>
                        <select
                            id="code-monitor-form-owner"
                            className={classNames('form-control mb-2 w-auto', styles.ownerDropdown)}
                            disabled={true}
                        >
                            <option value={authenticatedUser.displayName || authenticatedUser.username}>
                                {authenticatedUser.username}
                            </option>
                        </select>
                        <small className="text-muted">
                            Event history and configuration will not be shared. Code monitoring currently only supports
                            individual owners.
                        </small>
                    </div>
                    <hr className={classNames('my-3', styles.horizontalRule)} />
                    <div className="code-monitor-form__triggers mb-4">
                        <FormTriggerArea
                            query={currentCodeMonitorState.trigger.query}
                            onQueryChange={onQueryChange}
                            triggerCompleted={formCompletion.triggerCompleted}
                            setTriggerCompleted={setTriggerCompleted}
                            startExpanded={!!triggerQuery}
                        />
                    </div>
                    <div
                        className={classNames({
                            [styles.actionsDisabled]: !formCompletion.triggerCompleted,
                        })}
                    >
                        <FormActionArea
                            actions={currentCodeMonitorState.actions}
                            setActionsCompleted={setActionsCompleted}
                            actionsCompleted={formCompletion.actionCompleted}
                            authenticatedUser={authenticatedUser}
                            disabled={!formCompletion.triggerCompleted}
                            onActionsChange={onActionsChange}
                            description={currentCodeMonitorState.description}
                        />
                    </div>
                    <hr className={classNames('my-3', styles.horizontalRule)} />
                    <div>
                        <div className="d-flex">
                            <div>
                                <Toggle
                                    title="Active"
                                    value={currentCodeMonitorState.enabled}
                                    onToggle={onEnabledChange}
                                    className="mr-2"
                                    aria-describedby="code-monitor-form__toggle-description"
                                />{' '}
                            </div>
                            <div className="flex-column" id="code-monitor-form__toggle-description">
                                <div>{currentCodeMonitorState.enabled ? 'Active' : 'Inactive'}</div>
                                <div className="text-muted">
                                    {currentCodeMonitorState.enabled
                                        ? 'Code monitor will watch for the trigger and run actions in response'
                                        : 'Code monitor will not respond to trigger events'}
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
                <div>
                    <div className="d-flex justify-content-between my-4">
                        <div>
                            <button
                                type="submit"
                                disabled={
                                    !formCompletion.actionCompleted ||
                                    !formCompletion.triggerCompleted ||
                                    codeMonitorOrError === LOADING ||
                                    !hasChangedFields
                                }
                                className="btn btn-primary mr-2 test-submit-monitor"
                            >
                                {submitButtonLabel}
                            </button>
                            <button type="button" className="btn btn-secondary test-cancel-monitor" onClick={onCancel}>
                                Cancel
                            </button>
                        </div>
                        {showDeleteButton && (
                            <div>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger test-delete-monitor"
                                    onClick={toggleDeleteModal}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                    {isErrorLike(codeMonitorOrError) && (
                        <div className="alert alert-danger">Failed to create monitor: {codeMonitorOrError.message}</div>
                    )}
                </div>
            </Form>
            {showDeleteButton && (
                <DeleteMonitorModal
                    isOpen={showDeleteModal}
                    deleteCodeMonitor={deleteCodeMonitor}
                    history={history}
                    codeMonitor={codeMonitor}
                    toggleDeleteModal={toggleDeleteModal}
                />
            )}
        </>
    )
}
