export type Flashcard = {
    front: string;
    back: string;
};

export type ParsedStudyTools = {
    summary: string[];
    keyPoints: string[];
    flashcards: Flashcard[];
    quiz: string[];
    readingPlan: string[];
};

type StudySection = keyof ParsedStudyTools | 'unknown';

const sectionMatchers: Array<[StudySection, RegExp]> = [
    ['summary', /resumo|síntese|sintese/i],
    ['keyPoints', /pontos|principais|observa/i],
    ['flashcards', /flashcards?|cart/i],
    ['quiz', /quiz|perguntas?|revis/i],
    ['readingPlan', /plano|leitura/i],
];

export function parseStudyTools(text = ''): ParsedStudyTools {
    const parsed: ParsedStudyTools = {
        summary: [],
        keyPoints: [],
        flashcards: [],
        quiz: [],
        readingPlan: [],
    };
    let activeSection: StudySection = 'summary';
    let pendingFlashcardFront = '';

    const lines = text
        .split('\n')
        .map(cleanLine)
        .filter(Boolean);

    lines.forEach((line) => {
        const headingSection = sectionForHeading(line);

        if (headingSection) {
            activeSection = headingSection;
            return;
        }

        if (activeSection === 'flashcards') {
            const front = line.match(/^(?:q|pergunta)\s*[:\-]\s*(.+)/i);
            const back = line.match(/^(?:a|resposta)\s*[:\-]\s*(.+)/i);

            if (front) {
                pendingFlashcardFront = front[1].trim();
                return;
            }

            if (back && pendingFlashcardFront) {
                parsed.flashcards.push({
                    front: pendingFlashcardFront,
                    back: back[1].trim(),
                });
                pendingFlashcardFront = '';
                return;
            }

            const flashcard = flashcardFromLine(line);

            if (flashcard) {
                parsed.flashcards.push(flashcard);
                return;
            }
        }

        if (activeSection === 'quiz') {
            parsed.quiz.push(stripListMarker(line));
            return;
        }

        if (activeSection === 'readingPlan') {
            parsed.readingPlan.push(stripListMarker(line));
            return;
        }

        if (activeSection === 'keyPoints') {
            parsed.keyPoints.push(stripListMarker(line));
            return;
        }

        parsed.summary.push(stripListMarker(line));
    });

    if (parsed.summary.length === 0 && lines.length > 0) {
        parsed.summary = lines.slice(0, 2).map(stripListMarker);
    }

    if (parsed.keyPoints.length === 0) {
        parsed.keyPoints = parsed.summary.slice(0, 3);
    }

    if (parsed.quiz.length === 0) {
        parsed.quiz = lines
            .map(stripListMarker)
            .filter((line) => line.endsWith('?'))
            .slice(0, 4);
    }

    return parsed;
}

function sectionForHeading(line: string): StudySection | null {
    const normalized = line
        .replace(/^#+\s*/, '')
        .replace(/:$/, '')
        .trim();

    if (normalized.length > 48) {
        return null;
    }

    return sectionMatchers.find(([, matcher]) => matcher.test(normalized))?.[0] ?? null;
}

function flashcardFromLine(line: string): Flashcard | null {
    const normalized = stripListMarker(line)
        .replace(/^frente\s*[:\-]\s*/i, '')
        .trim();

    const explicit = normalized.match(/(.+?)\s+(?:verso|resposta)\s*[:\-]\s*(.+)/i);

    if (explicit) {
        return {
            front: explicit[1].trim(),
            back: explicit[2].trim(),
        };
    }

    const separator = normalized.includes('=>') ? '=>' : normalized.includes(' - ') ? ' - ' : ':';
    const [front, ...back] = normalized.split(separator);

    if (!front || back.length === 0) {
        return null;
    }

    return {
        front: front.trim(),
        back: back.join(separator).trim(),
    };
}

function cleanLine(line: string): string {
    return line
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .trim();
}

function stripListMarker(line: string): string {
    return line
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+[.)]\s+/, '')
        .trim();
}
