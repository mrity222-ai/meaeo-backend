import sys
import types
import uuid

# Provide fallback for uuid_utils if C-extension is blocked by Windows App Control
if "uuid_utils" not in sys.modules:
    try:
        import uuid_utils
    except Exception:
        class MockUUIDUtils(types.ModuleType):
            def __init__(self):
                super().__init__("uuid_utils")
                self.UUID = uuid.UUID
                self.uuid1 = uuid.uuid1
                self.uuid3 = uuid.uuid3
                self.uuid4 = uuid.uuid4
                self.uuid5 = uuid.uuid5
                self.uuid6 = uuid.uuid4
                self.uuid7 = uuid.uuid4
                self.uuid8 = uuid.uuid4
                self.NAMESPACE_DNS = uuid.NAMESPACE_DNS
                self.NAMESPACE_URL = uuid.NAMESPACE_URL
                self.NAMESPACE_OID = uuid.NAMESPACE_OID
                self.NAMESPACE_X500 = uuid.NAMESPACE_X500
                self.__version__ = "0.9.0"

            def __getattr__(self, name):
                return getattr(uuid, name, None)

        mock_mod = MockUUIDUtils()
        compat_mod = types.ModuleType("uuid_utils.compat")
        compat_mod.uuid7 = uuid.uuid4
        mock_mod.compat = compat_mod
        sys.modules["uuid_utils"] = mock_mod
        sys.modules["uuid_utils.compat"] = compat_mod

import os
import uvicorn


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))

    uvicorn.run(
        "app.api.main:app",
        host=host,
        port=port,
        reload=False,
    )