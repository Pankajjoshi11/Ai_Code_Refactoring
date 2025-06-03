// File renamed to deprecationRules.js
export const detectDeprecatedPatterns = (ast, traverse) => {
  const deprecatedPatterns = [];

  traverse(ast, {
    CallExpression(path) {
      // React.createClass
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
      // Promise.defer
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
      // arguments.callee
      if (
        path.node.callee?.type === 'MemberExpression' &&
        path.node.callee.object?.type === 'Identifier' &&
        path.node.callee.object.name === 'arguments' &&
        path.node.callee.property?.name === 'callee'
      ) {
        deprecatedPatterns.push({
          type: 'arguments.callee',
          line: path.node.loc.start.line,
          message: 'arguments.callee is deprecated. Use named functions or arrow functions.',
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
    VariableDeclaration(path) {
      if (path.node.kind === 'var') {
        deprecatedPatterns.push({
          type: 'var_usage',
          line: path.node.loc.start.line,
          message: 'var is outdated. Use let or const for better scoping.',
        });
      }
    },
  });

  return deprecatedPatterns;
};