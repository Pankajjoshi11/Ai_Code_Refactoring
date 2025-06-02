
export const detectDeprecatedPatterns = (ast, traverse) => {
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
};