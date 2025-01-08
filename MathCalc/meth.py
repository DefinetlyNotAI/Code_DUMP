def gcd(a, b):
    while b:
        a, b = b, a % b
    return a


def to_fraction(x, tolerance=1e-10):
    n = 1
    while abs(n * x - round(n * x)) > tolerance:
        n *= 10
    numerator = round(n * x)
    denominator = n
    common_divisor = gcd(numerator, denominator)
    numerator //= common_divisor
    denominator //= common_divisor
    return f"{numerator}/{denominator}" if denominator != 1 else f"{numerator}"


def parse_term(term):
    # Remove spaces and handle negative signs
    term = term.replace(' ', '')
    if term[0] == '-':
        sign = -1
        term = term[1:]
    else:
        sign = 1

    # Split the term into coefficient and variable parts
    if 'x' in term:
        parts = term.split('x')
        if parts[0] == '':
            coefficient = 1
        elif parts[0] == '-':
            coefficient = -1
        else:
            coefficient = float(parts[0])
        if len(parts) > 1 and parts[1] != '':
            exponent = int(parts[1][2:])  # Assuming the form is x**n
        else:
            exponent = 1
    else:
        coefficient = float(term)
        exponent = 0

    return sign * coefficient, exponent


def integrate_term(coefficient, exponent):
    if exponent == -1:
        return coefficient, 'ln|x|'
    new_exponent = exponent + 1
    new_coefficient = to_fraction(coefficient / new_exponent)
    return new_coefficient, new_exponent


def format_term(coefficient, exponent):
    if exponent == 'ln|x|':
        return f"{coefficient}ln|x|"

    if coefficient == 0:
        return ""

    if exponent == 0:
        return f"{coefficient}"
    elif exponent == 1:
        if coefficient == "1":
            return "x"
        return f"{coefficient}x"
    else:
        if coefficient == "1":
            return f"x^{exponent}"
        return f"{coefficient}x^{exponent}"


def integrate_polynomial(expression):
    terms = expression.split('+')
    integrated_terms = []

    for term in terms:
        coefficient, exponent = parse_term(term.strip())
        new_coefficient, new_exponent = integrate_term(coefficient, exponent)
        integrated_terms.append(format_term(new_coefficient, new_exponent))

    return ' + '.join(integrated_terms)


def main():
    formula = input("Enter the formula: ")
    integral = integrate_polynomial(formula)
    print(f"The indefinite integral is: {integral} + C")


if __name__ == "__main__":
    main()
