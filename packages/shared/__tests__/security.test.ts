/**
 * Teste pentru utilitarele de securitate — sanitizare, validare URL, injection.
 */
import {
  sanitizeText,
  escapeHtml,
  sanitizeUrl,
  validateStoragePath,
  isValidUuid,
  isValidEmail,
  isValidPhone,
  sanitizeMessage,
  containsSuspiciousUnicode,
  RateLimiter,
  passwordStrength,
  generateSecureId,
} from '../src';

describe('Security utilities', () => {
  describe('sanitizeText', () => {
    it('elimină null bytes și caractere de control', () => {
      const dirty = 'Rex\u0000\u0007X\u001Fy';
      expect(sanitizeText(dirty)).toBe('RexXy');
    });

    it('păstrează newline și tab', () => {
      expect(sanitizeText('linie1\nlinie2\tcurată')).toBe('linie1\nlinie2\tcurată');
    });

    it('limitează lungimea', () => {
      expect(sanitizeText('a'.repeat(5000), 100).length).toBe(100);
    });

    it('returnează empty pentru input gol/undefined', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('escapează caractere HTML periculoase', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('escapează single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#39;s');
    });
  });

  describe('sanitizeUrl', () => {
    it('acceptă URL-uri https', () => {
      expect(sanitizeUrl('https://example.com/img.jpg')).toBeTruthy();
    });

    it('acceptă scheme petcare/pawfectpair', () => {
      expect(sanitizeUrl('pawfectpair://auth/callback')).toBeTruthy();
      expect(sanitizeUrl('petcare://reset')).toBeTruthy();
    });

    it('blochează javascript: și data:', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeUrl('data:text/html,<h1>xss</h1>')).toBeNull();
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
      expect(sanitizeUrl('vbscript:msgbox')).toBeNull();
    });

    it('blochează scheme necunoscute', () => {
      expect(sanitizeUrl('ftp://files.com/x')).toBeNull();
      expect(sanitizeUrl('custom-unknown://x')).toBeNull();
    });

    it('blochează URL-uri malformate', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
      expect(sanitizeUrl(null)).toBeNull();
    });
  });

  describe('validateStoragePath', () => {
    const userId = '12345678-1234-1234-1234-123456789012';

    it('acceptă path valid {user_id}/{uuid}.jpg', () => {
      expect(validateStoragePath(`${userId}/abc-123.jpg`, userId)).toBe(true);
    });

    it('respinge path traversal', () => {
      expect(validateStoragePath(`${userId}/../../etc/passwd`, userId)).toBe(false);
      expect(validateStoragePath(`${userId}/..\\..\\win`, userId)).toBe(false);
    });

    it('respinge folder alt utilizator', () => {
      expect(validateStoragePath('alt-user/abc.jpg', userId)).toBe(false);
    });

    it('respinge caractere speciale periculoase', () => {
      expect(validateStoragePath(`${userId}/a$b<c>.jpg`, userId)).toBe(false);
    });
  });

  describe('isValidUuid', () => {
    it('acceptă UUID valid', () => {
      expect(isValidUuid('12345678-1234-1234-1234-123456789012')).toBe(true);
    });

    it('respinge non-UUID (injection attempt)', () => {
      expect(isValidUuid("'; DROP TABLE pets; --")).toBe(false);
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid(null)).toBe(false);
      expect(isValidUuid('123')).toBe(false);
    });
  });

  describe('isValidEmail / isValidPhone', () => {
    it('email valid', () => {
      expect(isValidEmail('ion.popescu@example.com')).toBe(true);
    });

    it('email invalid', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('a@b')).toBe(false);
      expect(isValidEmail('x'.repeat(300) + '@example.com')).toBe(false);
    });

    it('telefon RO valid', () => {
      expect(isValidPhone('+40712345678')).toBe(true);
      expect(isValidPhone('0712 345 678')).toBe(true);
    });

    it('telefon invalid', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
    });
  });

  describe('sanitizeMessage', () => {
    it('elimină zero-width characters (anti-spam)', () => {
      expect(sanitizeMessage('salut\u200B\u200D\uFEFFdin partea lui')).toBe('salutdin partea lui');
    });

    it('comprimă whitespace excesiv', () => {
      expect(sanitizeMessage('a          b')).toBe('a   b');
    });
  });

  describe('containsSuspiciousUnicode', () => {
    it('detectează homoglyph mixt (latin + cyrillic în același cuvânt)', () => {
      expect(containsSuspiciousUnicode('рaypal')).toBe(true); // р e chirilic
    });

    it('acceptă text normal', () => {
      expect(containsSuspiciousUnicode('Rex e cel mai bun câine')).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    it('permite N cereri apoi blochează', () => {
      const rl = new RateLimiter(3, 60000);
      expect(rl.allow('test')).toBe(true);
      expect(rl.allow('test')).toBe(true);
      expect(rl.allow('test')).toBe(true);
      expect(rl.allow('test')).toBe(false); // al 4-lea → blocat
    });

    it('chei diferite au contoare separate', () => {
      const rl = new RateLimiter(1, 60000);
      expect(rl.allow('user1')).toBe(true);
      expect(rl.allow('user2')).toBe(true);
      expect(rl.allow('user1')).toBe(false);
    });

    it('reset deblochează', () => {
      const rl = new RateLimiter(1, 60000);
      rl.allow('user');
      expect(rl.allow('user')).toBe(false);
      rl.reset('user');
      expect(rl.allow('user')).toBe(true);
    });
  });

  describe('passwordStrength', () => {
    it('parolă slabă → score mic', () => {
      expect(passwordStrength('parola123')).toBeLessThanOrEqual(1); // comună
      expect(passwordStrength('12345678')).toBeLessThanOrEqual(2);
    });

    it('parolă puternică → score mare', () => {
      expect(passwordStrength('M4y!SuperSecret#2026')).toBeGreaterThanOrEqual(3);
    });

    it('parolă goală → 0', () => {
      expect(passwordStrength('')).toBe(0);
    });
  });

  describe('generateSecureId', () => {
    it('generează ID de 32 chars', () => {
      expect(generateSecureId().length).toBe(32);
    });

    it('IDs consecutive diferă (entropie)', () => {
      const a = generateSecureId();
      const b = generateSecureId();
      expect(a).not.toBe(b);
    });
  });
});
