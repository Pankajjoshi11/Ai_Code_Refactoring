import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { detectDeprecatedPatterns } from './depricationRules';

export const parseJavaScriptCode = async (file) => {
  const text = await file.text();
  try {
    const ast = parse(text, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    const deprecatedPatterns = detectDeprecatedPatterns(ast, traverse);

    return { ast, deprecatedPatterns, code: text };
  } catch (error) {
    console.error('Parsing error:', error);
    return { error: error.message };
  }
};