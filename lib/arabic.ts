/**
 * Returns true if the string contains Arabic, Urdu, or Lisan ud Dawat characters.
 * Covers Arabic (U+0600–06FF), Arabic Supplement (0750–077F),
 * Arabic Extended-A (08A0–08FF), and Arabic Presentation Forms (FB50–FEFF).
 */
export function isArabic(text: string): boolean {
  return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text);
}
