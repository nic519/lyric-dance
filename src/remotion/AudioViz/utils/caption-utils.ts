import type { Caption } from "@remotion/captions";

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

export const findCaptionAt = (captions: Caption[], timeMs: number) => {
  let lo = 0;
  let hi = captions.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = captions[mid];
    if (timeMs < c.startMs) {
      hi = mid - 1;
    } else if (timeMs >= c.endMs) {
      lo = mid + 1;
    } else {
      return { caption: c, index: mid };
    }
  }
  return null;
};

export const getDistToNearestCaption = (captions: Caption[], timeMs: number): number => {
  // If inside a caption, distance is 0.
  // If outside, min(timeMs - prev.endMs, next.startMs - timeMs)

  // Find insertion point
  let lo = 0;
  let hi = captions.length - 1;
  let idx = captions.length; // Default to end (meaning after last caption)

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = captions[mid];
    if (c.startMs <= timeMs && c.endMs > timeMs) {
      return 0; // Inside caption
    }
    if (timeMs < c.startMs) {
      idx = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  // idx is the first caption that starts AFTER timeMs
  // idx-1 is the caption that ended BEFORE timeMs

  let dist = Infinity;

  if (idx < captions.length) {
    dist = Math.min(dist, captions[idx].startMs - timeMs);
  }

  if (idx > 0) {
    dist = Math.min(dist, timeMs - captions[idx - 1].endMs);
  }

  return dist;
};

export const getGapDuration = (captions: Caption[], timeMs: number): number => {
  // Determine if we are in a gap, and if so, how long it is.
  // Returns 0 if inside a caption.
  // Returns gap duration in ms if in a gap.

  let lo = 0;
  let hi = captions.length - 1;
  let idx = captions.length;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = captions[mid];
    if (c.startMs <= timeMs && c.endMs > timeMs) {
      return 0; // Inside caption
    }
    if (timeMs < c.startMs) {
      idx = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  // idx is the first caption that starts AFTER timeMs (next caption)
  // idx-1 is the caption that ended BEFORE timeMs (prev caption)

  // Case 1: Before first caption
  if (idx === 0) {
    return captions[0].startMs; // Gap from 0 to first caption
  }

  // Case 2: After last caption
  if (idx === captions.length) {
    return Infinity; // Or effectively infinite gap until end of video
  }

  // Case 3: Between two captions
  const prevEnd = captions[idx - 1].endMs;
  const nextStart = captions[idx].startMs;

  return nextStart - prevEnd;
};
