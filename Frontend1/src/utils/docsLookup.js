const docsMap = {
  'React.createClass': {
    url: 'https://react.dev/learn/your-first-component',
    description: 'Official React documentation on functional and class components.',
  },
  'PropTypes': {
    url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
    description: 'TypeScript documentation for type checking in React.',
  },
  'Promise.defer': {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
    description: 'MDN documentation on modern Promise usage.',
  },
  'print_statement': {
    url: 'https://docs.python.org/3/reference/simple_stmts.html#the-print-statement',
    description: 'Python documentation on print() function.',
  },
  'old_format': {
    url: 'https://docs.python.org/3/tutorial/inputoutput.html#fancier-output-formatting',
    description: 'Python documentation on f-strings and str.format().',
  },
  'bind_usage': {
    url: 'https://react.dev/learn/responding-to-events',
    description: 'React documentation on handling events without bind.',
  },
  'var_usage': {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let',
    description: 'MDN documentation on using let and const.',
  },
  'apply_usage': {
    url: 'https://docs.python.org/3/tutorial/controlflow.html#unpacking-argument-lists',
    description: 'Python documentation on argument unpacking.',
  },
  'xrange_usage': {
    url: 'https://docs.python.org/3/library/functions.html#range',
    description: 'Python documentation on range() function.',
  },
  'arguments.callee': {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments/callee',
    description: 'MDN documentation on alternatives to arguments.callee.',
  },
  'cmp_usage': {
    url: 'https://docs.python.org/3/howto/sorting.html#sorting-how-to',
    description: 'Python documentation on sorting with key functions.',
  },
};

export const lookupDocumentation = (patternType) => {
  return (
    docsMap[patternType] || {
      url: 'https://developer.mozilla.org/en-US/',
      description: 'No specific documentation found. Refer to MDN for general guidance.',
    }
  );
};