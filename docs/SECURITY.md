# Security Policy

## Supported Versions

Only the latest published version of `@seatgeek/next-fastly-image` receives security updates.

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/seatgeek/next-fastly-image/security/advisories/new) or by emailing opensource@seatgeek.com. We will acknowledge reports as quickly as we can and keep you informed of the fix timeline.

## Scope note

This package is a pure URL-building library: it performs no network requests, reads no files, and holds no state. The most likely vulnerability class is URL-construction bugs (e.g. parameter or host injection through crafted `src` values) - reports in that area are especially appreciated.
