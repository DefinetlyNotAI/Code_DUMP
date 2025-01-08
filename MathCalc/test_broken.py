# Test cases for IndefiniteIntegralSolver
from meth import IndefiniteIntegralSolver


def test_indefinite_integral_solver():
    test_cases = [
        # Easy cases
        ("3*x^2 + 2*x + 1", "1.0*x^3 + 1.0*x^2 + 1*x + C"),
        ("x^2 + x + 1", "0.3333333333333333*x^3 + 0.5*x^2 + 1*x + C"),
        ("5*x + 3", "2.5*x^2 + 3*x + C"),

        # Harder cases
        ("4*x^3 + 3*x^2 + 2*x + 1", "1.0*x^4 + 1.0*x^3 + 1.0*x^2 + 1*x + C"),
        ("6*x^5 + 5*x^4 + 4*x^3 + 3*x^2 + 2*x + 1", "1.0*x^6 + 1.0*x^5 + 1.0*x^4 + 1.0*x^3 + 1.0*x^2 + 1*x + C"),

        # Cases with brackets
        ("(3*x^2) + (2*x) + 1", "1.0*x^3 + 1.0*x^2 + 1*x + C"),
        ("(4*x^3) + (3*x^2) + (2*x) + 1", "1.0*x^4 + 1.0*x^3 + 1.0*x^2 + 1*x + C"),

        # Edge cases
        ("x", "0.5*x^2 + C"),
        ("1", "1*x + C"),
        ("x^0.5", "0.6666666666666666*x^1.5 + C"),
        ("1/2", "0.5*x + C"),
        ("1/x", "-1/2*x^-2 + C"),
        ("0", "0*x + C"),
        ("x^2", "0.3333333333333333*x^3 + C"),
        ("x^3", "0.25*x^4 + C"),
        ("x^4", "0.2*x^5 + C"),
        ("x^5", "0.16666666666666666*x^6 + C"),
        ("(1/2)*(x^2)", "0.16666666666666666*x^3 + C"),
        ("(-1/2)*(x^-1)", "x^-2"),
        ("(1/2)*(x^-1/2)", "x^0.5 + C"),

        # Invalid cases (should handle gracefully)
        ("3*x^2 + 2*y + 1", "1.0*x^3 + 2.0*x + 1*x + C"),  # y is not a valid variable for integration
        ("3*x^2 + 2* + 1", "1.0*x^3 + 2.0*x + 1*x + C"),  # Invalid term "2*"
    ]

    counter = 0
    fail_counter = 0
    for expression, expected in test_cases:
        solver = IndefiniteIntegralSolver(expression)
        result = solver.integrate()
        try:
            assert result == expected, f"Test failed for expression: {expression}. Expected: {expected}, Got: {result}"
            print(f"✅ Test passed for expression: {expression}. Result: {result}")
        except AssertionError:
            print(f"❌ Test failed for expression: {expression}. Expected: {expected}, Got: {result}")
            fail_counter += 1
        counter += 1
    print(f"\nTotal tests 🧪: {counter}, "
          f"\nPassed ✅: {counter - fail_counter}, "
          f"\nFailed ❌: {fail_counter}")

# Run the tests
test_indefinite_integral_solver()
