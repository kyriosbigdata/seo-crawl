import fs from 'fs';

export function readJsonl(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const rows = [];
    const fd = fs.openSync(filePath, 'r');

    const BUFFER_SIZE = 1024 * 1024; // 1 MB
    const buffer = Buffer.alloc(BUFFER_SIZE);

    let leftover = '';

    try {
        while (true) {
            const bytesRead = fs.readSync(fd, buffer, 0, BUFFER_SIZE, null);

            if (bytesRead === 0) break;

            const chunk = leftover + buffer.toString('utf8', 0, bytesRead);
            const lines = chunk.split('\n');

            leftover = lines.pop() || '';

            for (const line of lines) {
                const cleanLine = line.trim();

                if (!cleanLine) continue;

                rows.push(JSON.parse(cleanLine));
            }
        }

        const finalLine = leftover.trim();

        if (finalLine) {
            rows.push(JSON.parse(finalLine));
        }
    } finally {
        fs.closeSync(fd);
    }

    return rows;
}