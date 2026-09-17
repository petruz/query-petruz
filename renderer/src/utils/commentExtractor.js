/**
 * Extracts SQL comments from a query string.
 * Supports both single-line (--) and multi-line (/* *\/) comment formats.
 * 
 * @param {string} sql - The SQL query string
 * @returns {string} - Combined comment text, or empty string if no comments found
 */
export function extractSqlComments(sql) {
    if (!sql || typeof sql !== 'string') {
        return '';
    }

    const comments = [];

    // Extract multi-line comments /* ... */
    const multiLineRegex = /\/\*[\s\S]*?\*\//g;
    const multiLineMatches = sql.match(multiLineRegex);
    if (multiLineMatches) {
        multiLineMatches.forEach(match => {
            // Remove /* and */ and trim
            const cleanComment = match.replace(/^\/\*/, '').replace(/\*\/$/, '').trim();
            if (cleanComment) {
                comments.push(cleanComment);
            }
        });
    }

    // Extract single-line comments -- ...
    const singleLineRegex = /--[^\n\r]*/g;
    const singleLineMatches = sql.match(singleLineRegex);
    if (singleLineMatches) {
        singleLineMatches.forEach(match => {
            // Remove -- and trim
            const cleanComment = match.replace(/^--/, '').trim();
            if (cleanComment) {
                comments.push(cleanComment);
            }
        });
    }

    // Join all comments with line breaks
    return comments.join('\n');
}
