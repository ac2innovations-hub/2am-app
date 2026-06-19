#!/bin/sh
set -e

# Xcode Cloud post-clone hook.
#
# The iOS project resolves Capacitor plugins through Swift Package Manager using
# LOCAL paths into node_modules — see ios/App/CapApp-SPM/Package.swift, e.g.
#   .package(name: "CapacitorCommunityInAppReview",
#            path: "../../../node_modules/@capacitor-community/in-app-review")
# Xcode Cloud only clones the repo; it never installs JS dependencies, so those
# paths don't exist when xcodebuild resolves packages and SPM fails with
# "could not resolve package dependencies … doesn't exist in file system".
#
# Fix: install Node, restore node_modules (npm ci), then sync Capacitor's native
# config (npx cap sync ios) so Package.swift matches package.json — before the
# archive step. This also self-heals a stale plugin reference: if a plugin were
# removed from package.json but still listed in Package.swift, cap sync rewrites
# it out.

echo "===> [ci_post_clone] installing Node 22 (LTS) via Homebrew"
brew install node@22
# node@22 is keg-only — put its bin on PATH so node/npm/npx resolve to it.
# Keep in sync with .nvmrc and package.json "engines.node".
export PATH="$(brew --prefix node@22)/bin:$PATH"

# Run from the repo root, where package.json and capacitor.config.ts live.
# Xcode Cloud sets CI_PRIMARY_REPOSITORY_PATH; fall back to walking up from this
# script (ios/App/ci_scripts -> repo root) if it's somehow unset.
cd "${CI_PRIMARY_REPOSITORY_PATH:-"$(cd "$(dirname "$0")/../../.." && pwd)"}"
echo "===> [ci_post_clone] working dir: $(pwd)"
node --version
npm --version

echo "===> [ci_post_clone] npm ci"
npm ci

echo "===> [ci_post_clone] npx cap sync ios"
npx cap sync ios

echo "===> [ci_post_clone] done"
