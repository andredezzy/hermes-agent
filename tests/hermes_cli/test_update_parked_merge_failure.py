"""In-place update on a parked branch: distinguishing why a merge failed.

`update_in_place` merges origin/<branch> into a custom branch so local commits
survive. When that merge fails the user is told there is a conflict to resolve
by hand — but on a shallow checkout the merge can fail for a completely
different reason: the fetched origin/<branch> has no commit in common with the
local history, so git refuses with "unrelated histories". Nothing is conflicted
and there is nothing to resolve; the fix is to deepen the fetch. Telling that
user to run `git merge` by hand sends them to the same refusal.
"""

from hermes_cli import update_cmd


UNRELATED_HISTORIES_STDERR = "fatal: refusing to merge unrelated histories"
REAL_CONFLICT_STDERR = (
    "Auto-merging hermes_cli/update_cmd.py\n"
    "CONFLICT (content): Merge conflict in hermes_cli/update_cmd.py\n"
    "Automatic merge failed; fix conflicts and then commit the result."
)


class TestClassifyMergeFailure:
    def test_unrelated_histories_is_a_truncated_history_not_a_conflict(self):
        msg = update_cmd._classify_merge_failure(UNRELATED_HISTORIES_STDERR)
        assert "shallow" in msg.lower()
        # It may say "not a conflict" — what it must not do is announce one.
        assert not msg.startswith("✗ Merge conflict")

    def test_unrelated_histories_names_the_deepening_remedy(self):
        # The remedy is fetching more history, not editing files.
        msg = update_cmd._classify_merge_failure(UNRELATED_HISTORIES_STDERR)
        assert "--deepen" in msg or "unshallow" in msg

    def test_a_real_conflict_is_still_reported_as_a_conflict(self):
        msg = update_cmd._classify_merge_failure(REAL_CONFLICT_STDERR)
        assert "conflict" in msg.lower()

    def test_an_unrecognised_failure_stays_generic(self):
        msg = update_cmd._classify_merge_failure("error: something novel")
        assert "conflict" in msg.lower()
