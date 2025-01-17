package database

import (
	"database/sql"

	"github.com/sourcegraph/sourcegraph/enterprise/internal/authz/bitbucketserver"
	"github.com/sourcegraph/sourcegraph/enterprise/internal/authz/github"
	"github.com/sourcegraph/sourcegraph/enterprise/internal/authz/gitlab"
	"github.com/sourcegraph/sourcegraph/enterprise/internal/authz/perforce"
	"github.com/sourcegraph/sourcegraph/internal/database"
	"github.com/sourcegraph/sourcegraph/internal/database/basestore"
	"github.com/sourcegraph/sourcegraph/internal/database/dbutil"
	"github.com/sourcegraph/sourcegraph/schema"
)

// NewExternalServicesStore returns an OSS database.ExternalServicesStore set with
// enterprise validators.
func NewExternalServicesStore(db dbutil.DB) *database.ExternalServiceStore {
	es := &database.ExternalServiceStore{Store: basestore.NewWithDB(db, sql.TxOptions{})}

	es.GitHubValidators = []func(*schema.GitHubConnection) error{
		github.ValidateAuthz,
	}
	es.GitLabValidators = []func(*schema.GitLabConnection, []schema.AuthProviders) error{
		gitlab.ValidateAuthz,
	}
	es.BitbucketServerValidators = []func(*schema.BitbucketServerConnection) error{
		bitbucketserver.ValidateAuthz,
	}
	es.PerforceValidators = []func(connection *schema.PerforceConnection) error{
		perforce.ValidateAuthz,
	}

	return es
}
