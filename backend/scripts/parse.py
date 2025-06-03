import ast
import sys
import json
import time

def detect_deprecated_patterns(tree):
    start_time = time.time()
    deprecated_patterns = []

    class DeprecationVisitor(ast.NodeVisitor):
        def visit_Print(self, node):
            deprecated_patterns.append({
                'type': 'print_statement',
                'line': node.lineno,
                'message': 'Python 2 print statement is deprecated. Use print() function.'
            })
            self.generic_visit(node)

        def visit_Str(self, node):
            if isinstance(node.s, str) and '%' in node.s:
                deprecated_patterns.append({
                    'type': 'old_format',
                    'line': node.lineno,
                    'message': 'Old-style % formatting is deprecated. Use f-strings or str.format().'
                })
            self.generic_visit(node)

        def visit_Name(self, node):
            if node.id == 'xrange':
                deprecated_patterns.append({
                    'type': 'xrange_usage',
                    'line': node.lineno,
                    'message': 'xrange is deprecated in Python 3. Use range() instead.'
                })
            self.generic_visit(node)

        def visit_Call(self, node):
            if isinstance(node.func, ast.Name) and node.func.id == 'sorted' and node.keywords:
                for keyword in node.keywords:
                    if keyword.arg == 'cmp':
                        deprecated_patterns.append({
                            'type': 'cmp_usage',
                            'line': node.lineno,
                            'message': 'cmp parameter in sorted() is deprecated. Use key function instead.'
                        })
            self.generic_visit(node)

    visitor = DeprecationVisitor()
    visitor.visit(tree)
    print(f"Time to detect deprecated patterns: {time.time() - start_time} seconds", file=sys.stderr)
    return deprecated_patterns

def parse_python_code(code):
    try:
        start_time = time.time()
        tree = ast.parse(code)
        print(f"Time to parse AST: {time.time() - start_time} seconds", file=sys.stderr)
        
        deprecated_patterns = detect_deprecated_patterns(tree)
        return {'deprecated': deprecated_patterns, 'error': None}
    except SyntaxError as e:
        return {'deprecated': [], 'error': str(e)}
    except Exception as e:
        return {'deprecated': [], 'error': f'Unexpected error: {str(e)}'}

if __name__ == '__main__':
    start_time = time.time()
    # Read code from stdin
    code = sys.stdin.read()
    print(f"Time to read input: {time.time() - start_time} seconds", file=sys.stderr)

    result = parse_python_code(code)
    # Output result as JSON to stdout
    print(json.dumps(result))
    print(f"Total execution time: {time.time() - start_time} seconds", file=sys.stderr)