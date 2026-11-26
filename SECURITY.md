# Security Policy

BVD is pre-release. Please report vulnerabilities privately through GitHub's "Report a vulnerability" (Security Advisories) on the project repository once it is confirmed and published, rather than opening a public issue.

Design commitments: context isolation, sandboxed renderer, strict CSP, validated IPC from the app's own frame only, argument-array process spawning (never a shell), no telemetry, no stored credentials or cookies, redaction of sensitive URL parameters in logs.

Unsigned Windows builds may trigger SmartScreen. BVD does not claim to be code-signed. Never disable Defender or SmartScreen to run it.
