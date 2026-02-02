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
