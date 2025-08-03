import ast


class Analyzer(ast.NodeVisitor):
    def __init__(self):
        self.loops = 0
        self.conditions = 0
        self.functions = []

    def visit_FunctionDef(self, node):
        print(f"Function '{node.name}' detected")
        self.functions.append(node.name)
        self.generic_visit(node)

    def visit_For(self, node):
        self.loops += 1
        self.generic_visit(node)

    def visit_While(self, node):
        self.loops += 1
        self.generic_visit(node)

    def visit_If(self, node):
        self.conditions += 1
        self.generic_visit(node)


def analyze_code(code: str):
    tree = ast.parse(code)
    analyzer = Analyzer()
    analyzer.visit(tree)
    print(f"Total loops: {analyzer.loops}")
    print(f"Total conditionals: {analyzer.conditions}")
    print(f"Total functions: {len(analyzer.functions)}")
    # print(f"Code Complexity (approx): O(n^{analyzer.loops})")
