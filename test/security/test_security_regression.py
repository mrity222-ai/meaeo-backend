import subprocess
import sys


TESTS = [
    "test_security_config.py",
    "test_oauth.py",
    "test_credential_repository.py",
    "test_credential_encryption.py",
    "test_oauth_service.py",
    "test_oauth_transaction_repository.py",
    "test_oauth_transaction_service.py",
    "test_credential_refresh.py",
    "test_tenant_authorization.py",
    "test_credential_tenant_isolation.py",
]


def run_test(test_file: str) -> bool:

    print()
    print("=" * 60)
    print(f"Running: {test_file}")
    print("=" * 60)

    result = subprocess.run(
        [
            sys.executable,
            test_file,
        ],
        capture_output=False,
    )

    if result.returncode != 0:

        print()
        print(
            f"FAILED: {test_file}"
        )

        return False

    print()
    print(
        f"PASSED: {test_file}"
    )

    return True


def main():

    failures = []

    for test in TESTS:

        if not run_test(test):
            failures.append(test)

    print()
    print("=" * 60)
    print("SECURITY REGRESSION SUMMARY")
    print("=" * 60)

    print(
        f"Tests executed: {len(TESTS)}"
    )

    print(
        f"Failures: {len(failures)}"
    )

    if failures:

        print()
        print("Failed tests:")

        for test in failures:
            print(
                f" - {test}"
            )

        raise SystemExit(1)

    print()
    print(
        "SECURITY REGRESSION TEST: PASSED"
    )


if __name__ == "__main__":
    main()