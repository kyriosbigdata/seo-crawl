import fs from 'fs';

export function writeJsonl(filePath, rows) {
    const CHUNK_SIZE = 5000;

    fs.writeFileSync(filePath, '', 'utf8');

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows
            .slice(i, i + CHUNK_SIZE)
            .map(row => JSON.stringify(row))
            .join('\n');

        const isLastChunk = i + CHUNK_SIZE >= rows.length;

        fs.appendFileSync(
            filePath,
            isLastChunk ? chunk : `${chunk}\n`,
            'utf8'
        );
    }
}