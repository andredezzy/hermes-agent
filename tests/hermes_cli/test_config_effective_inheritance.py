"""Profile inheritance in the one effective-config primitive.

``load_user_config_effective`` is what the gateway, cron, the messaging gateway and
logging all read, so inheritance has to live here rather than in any one caller —
a profile that opted in must look the same to every surface.
"""

from pathlib import Path

import pytest

from hermes_cli.config_effective import load_user_config_effective


@pytest.fixture
def inheriting_profile(tmp_path, monkeypatch):
    """A root config plus a named profile that opted into inheritance."""
    home = tmp_path / ".hermes"
    (home / "profiles" / "bot").mkdir(parents=True)
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    monkeypatch.setenv("HERMES_HOME", str(home))
    (home / "config.yaml").write_text(
        "model: root-model\nprovider: root-provider\n", encoding="utf-8")
    profile = home / "profiles" / "bot" / "config.yaml"
    profile.write_text("inherit: true\n", encoding="utf-8")
    return profile


def test_inheriting_profile_sees_the_root_model(inheriting_profile):
    """Without this the profile reads as model-less and callers invent a default."""
    assert load_user_config_effective(inheriting_profile)["model"]["default"] == "root-model"


def test_profile_overrides_beat_the_inherited_value(inheriting_profile):
    """Inheritance fills gaps; it never overwrites what the profile states itself."""
    inheriting_profile.write_text(
        "inherit: true\nmodel: own-model\n", encoding="utf-8")
    effective = load_user_config_effective(inheriting_profile)["model"]

    assert effective["default"] == "own-model"
    assert effective["provider"] == "root-provider"


def test_a_root_edit_is_visible_without_touching_the_profile(inheriting_profile):
    """The cache keys on both files, so changing the root alone must invalidate it."""
    root = inheriting_profile.parent.parent.parent / "config.yaml"

    assert load_user_config_effective(inheriting_profile)["model"]["default"] == "root-model"

    root.write_text("model: switched-model\nprovider: root-provider\n", encoding="utf-8")

    assert load_user_config_effective(inheriting_profile)["model"]["default"] == "switched-model"


def test_a_profile_that_did_not_opt_in_stays_isolated(inheriting_profile):
    """Profiles are independent islands unless they ask otherwise."""
    inheriting_profile.write_text("provider: own-provider\n", encoding="utf-8")
    effective = load_user_config_effective(inheriting_profile)

    # Canonicalization nests the root-level provider under `model`; what matters
    # is that nothing of the parent's leaked in.
    assert effective.get("model", {}).get("provider") == "own-provider"
    assert "root-model" not in repr(effective)
