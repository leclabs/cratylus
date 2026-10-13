# Held-out · checks

Context: development. Used only in judgment.

1. (history) **Given** a pull request that renames a stored design record and corrects its contents
   while leaving the code passing its check, **when** the ordinary commit and CI paths handle the
   change, **then** neither rejects it as removal of one historical record and addition of another;
   review remains the control, with no special bypass for the rename.

2. (check) **Given** CI workflows for both pull requests and releases, **when** their validation
   steps are compared with the local check, **then** both use that same check without a separate
   packaging smoke test, record gate or other CI-only validation. A retained validation belongs
   inside the local check and therefore runs locally too; producing and publishing a release is
   not an additional validation.
