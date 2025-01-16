import json
import pathlib

import pytest


@pytest.fixture
def json_fixture(request: pytest.FixtureRequest) -> dict:
    test_dir = pathlib.Path(request.node.fspath).parent
    with open(test_dir / "fixtures" / request.param) as f:
        data = json.load(f)
    return data
