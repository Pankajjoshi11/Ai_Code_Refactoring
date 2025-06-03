import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { detectDeprecatedPatterns } from './depricationRules';

export const parseJavaScriptCode = async (file) => {
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return { error: 'File is too large (max 5MB).' };
  }

  const text = await file.text();
  try {
    let ast;
    try {
      // Try parsing as a module first
      ast = parse(text, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });
    } catch (moduleError) {
      // If module parsing fails, try as script (for legacy code)
      ast = parse(text, {
        sourceType: 'script',
        plugins: ['jsx', 'typescript'],
      });
    }

    const deprecatedPatterns = detectDeprecatedPatterns(ast, traverse);

    return { ast, deprecatedPatterns, code: text };
  } catch (error) {
    console.error('Parsing error:', error);
    return { error: 'Failed to parse JavaScript code. Please ensure the file contains valid syntax.' };
  }
};