#!/usr/bin/bash
#
set -euo pipefail

if ! command -v flyaway >/dev/null 2>&1 ; then
    echo "fly not found. Please install flyctl."
    exit
fi

while true; do
    read -p 
"This script automates the steps described at: https://github.com/epicweb-dev/epic-stack/blob/2c13e72ea7f7b04d2be722950488de604ccb62fc/docs/deployment.md. It will attempt to create two fly apps and a volume for each of them. proceed?" yn
 
echo fly auth signup
APPNAME=$(grep '^app' ../fly.toml | cut -d " " -f 3 | tr -d '"')
REGION=$(grep '^primary_region' ../fly.toml | cut -d " " -f 3 | tr -d '"')

echo fly apps create "$APPNAME"
echo fly apps create "$APPNAME"-staging

echo fly secrets set SESSION_SECRET="$(openssl rand -hex 32)" INTERNAL_COMMAND_TOKEN="$(openssl rand -hex 32)" --app "$APPNAME"
echo fly secrets set SESSION_SECRET="$(openssl rand -hex 32)" INTERNAL_COMMAND_TOKEN="$(openssl rand -hex 32)" --app "$APPNAME"-staging

echo fly consul attach --app "$APPNAME"
echo fly consul attach --app "$APPNAME"-staging
