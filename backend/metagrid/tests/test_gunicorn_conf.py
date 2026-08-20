import importlib

import gunicorn_conf


def test_reload_defaults_to_false(monkeypatch):
    monkeypatch.delenv("GUNICORN_RELOAD", raising=False)

    importlib.reload(gunicorn_conf)

    assert gunicorn_conf.reload is False


def test_reload_can_be_enabled_via_env_var(monkeypatch):
    monkeypatch.setenv("GUNICORN_RELOAD", "true")

    importlib.reload(gunicorn_conf)

    assert gunicorn_conf.reload is True


def test_reload_false_value_remains_disabled(monkeypatch):
    monkeypatch.setenv("GUNICORN_RELOAD", "false")

    importlib.reload(gunicorn_conf)

    assert gunicorn_conf.reload is False
