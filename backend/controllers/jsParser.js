const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function detectDeprecatedPatterns(ast) {
  const deprecatedPatterns = [];

  traverse(ast, {
    CallExpression(path) {
      if (
        path.node.callee.object?.name === 'React' &&
        path.node.callee.property?.name === 'createClass'
      ) {
        deprecatedPatterns.push({
          type: 'React.createClass',
          line: path.node.loc.start.line,
          message: 'React.createClass is deprecated. Use functional components or class components.',
        });
      }
      if (
        path.node.callee.object?.name === 'Promise' &&
        path.node.callee.property?.name === 'defer'
      ) {
        deprecatedPatterns.push({
          type: 'Promise.defer',
          line: path.node.loc.start.line,
          message: 'Promise.defer is non-standard and deprecated. Use Promise constructor.',
        });
      }
    },
    ImportDeclaration(path) {
      if (path.node.source.value === 'prop-types') {
        deprecatedPatterns.push({
          type: 'PropTypes',
          line: path.node.loc.start.line,
          message: 'PropTypes is deprecated in favor of TypeScript or prop validation libraries.',
        });
      }
    },
  });

  return deprecatedPatterns;
}

async function parseJavaScriptCode(req, res) {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Missing code' });
  }

  if (code.length > 5 * 1024 * 1024) { // 5MB limit
    return res.status(400).json({ message: 'Code is too large (max 5MB)' });
  }

  try {
    let ast;
    try {
      // Try parsing as a module first
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });
    } catch (moduleError) {
      // Fall back to script for legacy code
      ast = parse(code, {
        sourceType: 'script',
        plugins: ['jsx', 'typescript'],
      });
    }

    const deprecatedPatterns = detectDeprecatedPatterns(ast);
    res.json({ deprecated: deprecatedPatterns, error: null });
  } catch (error) {
    console.error('JavaScript parsing error:', error);
    res.status(500).json({ deprecated: [], error: 'Failed to parse JavaScript code. Please ensure the code has valid syntax.' });
  }
}

module.exports = { parseJavaScriptCode };