---
title: Infrastructure as Code in Power Platform with Terraform
status: offered
order: 1
format: session
topics: ["Infrastructure as Code", "Terraform", "ALM", "Governance"]
featured: true
summary: >-
  Power Platform environments are usually clicked into existence - admin center,
  PPAC, maker portal - which means the moment you need the same setup twice, in a
  different region or for a different environment, you're relying on memory and
  screenshots. This talk treats environments, connections, DLP policies and
  settings as infrastructure: defined in code, reviewed in a pull request, and
  reproducible on demand.

  Using Microsoft's official Terraform provider for Power Platform, we build an
  environment from nothing - provisioning, connection references, environment
  groups and rule-based policies - and see where Terraform's declarative model
  fits cleanly onto Power Platform's APIs and where it doesn't. Along the way:
  state management for a platform that also lets makers change things by hand,
  drift detection, and how this sits alongside a Dataverse solution pipeline
  rather than replacing it.

  Less a syntax tour, more a look at what's actually happening underneath the
  resource blocks - and an honest account of where the provider still has gaps.
---
