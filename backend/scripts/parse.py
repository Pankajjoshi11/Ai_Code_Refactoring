import sys
import ast
import json

def detect_deprecated(code):
    try:
        tree = ast.parse(code)
        deprecated = []

        for node in ast.walk(tree):
            # Example: Detect deprecated print statement (Python 2 style)
            if isinstance(node, ast.Print):
                deprecated.append({
                    'type': 'print_statement',
                    'line': node.lineno,
                    'message': 'Python 2 print statement is deprecated. Use print() function.',
                })
            # Example: Detect old-style string formatting
            elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.Mod):
                if isinstance(node.left, ast.Str):
                    deprecated.append({
                        'type': 'old_format',
                        'line': node.lineno,
                        'message': 'Old-style % formatting is deprecated. Use f-strings or str.format().',
                    })

        return {'deprecated': deprecated, 'error': None}
    except Exception as e:
        return {'deprecated': [], 'error': str(e)}

if __name__ == "__main__":
    code = sys.argv[1]
    result = detect_deprecated(code)
    print(json.dumps(result))