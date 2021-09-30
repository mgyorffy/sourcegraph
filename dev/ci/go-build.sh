#!/usr/bin/env bash

set -e

# Separate out time for go mod from go install
echo "--- go mod download"
go mod download

echo "--- go generate"
go generate ./...


echo "--- QA SECRETS REDACTION"
VERY_SECRET_TOKEN="corgi doggos best doggos"
echo "Testing a token just defined here"
echo $VERY_SECRET_TOKEN
echo "Testing an existing token"
echo $PERCY_TOKEN

echo "--- go install"
go install -tags dist ./cmd/... ./enterprise/cmd/...
