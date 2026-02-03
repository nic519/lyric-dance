import type { Caption } from '@remotion/captions';

export type TagType = 'zoom' | 'shake' | 'color';

export interface Tag {
  type: TagType;
  value?: string;
}

export interface CaptionSegment {
  text: string;
  tags: Tag[];
}

export interface CaptionLine {
  segments: CaptionSegment[];
}

/**
 * Parses a caption string with markers like [zoom]text[/zoom], [shake]text[/shake], [color=#ff0000]text[/color]
 * and splits by spaces into multiple lines as requested.
 * Supports basic nesting like [zoom][shake]text[/shake][/zoom].
 */
export function parseCaptionText(text: string): CaptionLine[] {
  // 1. Split by spaces to handle "new line for each word" requirement
  const words = text.trim().split(/\s+/);

  return words.map(word => {
    const segments: CaptionSegment[] = [];

    // Recursive function to parse tags
    const parseTags = (input: string, activeTags: Tag[] = []) => {
      const tagRegex = /\[(zoom|shake|color)=?([^\]]*)\](.*?)\[\/\1\]/g;
      let lastIndex = 0;
      let match;
      let foundAny = false;

      while ((match = tagRegex.exec(input)) !== null) {
        foundAny = true;
        // Plain text before the tag
        if (match.index > lastIndex) {
          segments.push({
            text: input.substring(lastIndex, match.index),
            tags: [...activeTags],
          });
        }

        const type = match[1] as TagType;
        const value = match[2] || undefined;
        const content = match[3];

        // Recurse into content with the new tag added
        parseTags(content, [...activeTags, { type, value }]);

        lastIndex = tagRegex.lastIndex;
      }

      // Remaining plain text after last tag
      if (!foundAny) {
        if (input.length > 0) {
          segments.push({
            text: input,
            tags: [...activeTags],
          });
        }
      } else if (lastIndex < input.length) {
        segments.push({
          text: input.substring(lastIndex),
          tags: [...activeTags],
        });
      }
    };

    parseTags(word);

    // Fallback for empty word
    if (segments.length === 0 && word.length > 0) {
      segments.push({ text: word, tags: [] });
    }

    return { segments };
  });
}

/**
 * Calculates the distance to the nearest caption in milliseconds.
 * Returns 0 if currently inside a caption.
 */
export function getDistToNearestCaption(captions: Caption[], timeMs: number): number {
  if (captions.length === 0) return Infinity;

  let minDist = Infinity;

  for (const caption of captions) {
    if (timeMs >= caption.startMs && timeMs <= caption.endMs) {
      return 0;
    }

    const distToStart = Math.abs(caption.startMs - timeMs);
    const distToEnd = Math.abs(caption.endMs - timeMs);
    minDist = Math.min(minDist, distToStart, distToEnd);
  }

  return minDist;
}

/**
 * Calculates the duration of the current gap (silence) the time falls into.
 * If the time is inside a caption, returns 0.
 */
export function getGapDuration(captions: Caption[], timeMs: number): number {
  if (captions.length === 0) return Infinity;

  // Check if inside any caption
  for (const caption of captions) {
    if (timeMs >= caption.startMs && timeMs <= caption.endMs) {
      return 0;
    }
  }

  // Find the gap
  // Before first caption
  if (timeMs < captions[0].startMs) {
    return captions[0].startMs;
  }

  // Between captions
  for (let i = 0; i < captions.length - 1; i++) {
    if (timeMs > captions[i].endMs && timeMs < captions[i + 1].startMs) {
      return captions[i + 1].startMs - captions[i].endMs;
    }
  }

  // After last caption
  if (timeMs > captions[captions.length - 1].endMs) {
    // We don't know the end of the video here, return a large number
    return Infinity;
  }

  return 0;
}

