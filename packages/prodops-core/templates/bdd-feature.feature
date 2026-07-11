# Canonical location: paths.bdd from manifest.yaml → <capability>.feature
# Scenarios are the source for TDD — the Red phase derives its failing test
# from a scenario here, never from invented criteria.

Feature: <capability>
  As <actor>
  I want <action>
  So that <business outcome>

  Background:
    Given <system-wide precondition shared by all scenarios>

  Scenario: <happy path>
    Given <precondition>
    When <the actor performs the action>
    Then <the observable outcome>
    And the event "<domain>.<entity>.<action>" is recorded with "<dimension>"

  Scenario: <failure is observable>
    When <the action is performed under the failure condition>
    Then <the observable rejection, e.g. an error status>
    And the event "<domain>.<entity>.<action>_failed" is recorded with "reason"
    And <no sensitive value is exposed in the response or logs>

  Scenario: <boundary or idempotency case>
    Given <the edge precondition>
    When <the action is repeated or hits the boundary>
    Then <the contract-preserving outcome>
