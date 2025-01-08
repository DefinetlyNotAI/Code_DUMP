class IndefiniteIntegralSolver:
    def __init__(self, expression):
        self.expression = expression

    def integrate(self):
        try:
            terms = self.parse_expression(self.expression)
            integrated_terms = [self.integrate_term(term) for term in terms]
            result = " + ".join(integrated_terms) + " + C"
            return result
        except Exception as e:
            return str(e)

    def parse_expression(self, expression):
        expression = expression.replace(" ", "")
        terms = []
        term = ""
        in_parentheses = 0

        for char in expression:
            if char == "(":
                in_parentheses += 1
            elif char == ")":
                in_parentheses -= 1

            if char == "+" and in_parentheses == 0:
                terms.append(term)
                term = ""
            else:
                term += char

        terms.append(term)
        return terms

    def integrate_term(self, term):
        if "x" not in term:
            if "/" in term:
                num, denom = term.split("/")
                return f"{float(num) / float(denom)}*x"
            return f"{term}*x"

        if "^" in term:
            base, exponent = term.split("^")
            if base == "x":
                new_exponent = float(exponent) + 1
                coefficient = 1 / new_exponent
                return f"{coefficient}*x^{new_exponent}"
            else:
                coefficient, base = base.split("*")
                new_exponent = float(exponent) + 1
                coefficient = float(coefficient) / new_exponent
                return f"{coefficient}*x^{new_exponent}"
        elif "*" in term:
            coefficient, base = term.split("*")
            if base == "x":
                return f"{float(coefficient) / 2}*x^2"
            else:
                raise ValueError("Invalid term")
        elif term == "x":
            return "0.5*x^2"
        elif term == "0":
            return "0*x"
        else:
            raise ValueError("Invalid term")
