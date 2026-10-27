/**
 * Teste PetConnect — validare Zod + utils forum.
 */
import { ForumPostSchema, ForumCommentSchema } from '../src/validation/connect';
import {
  connectCategoryKey,
  filterPosts,
  sortPosts,
  postExcerpt,
} from '../src/utils/connect';
import type { ForumPostWithRefs } from '../src/types/connect';

function makePost(overrides: Partial<ForumPostWithRefs> = {}): ForumPostWithRefs {
  return {
    id: 'f1',
    author_id: '11111111-1111-1111-1111-111111111111',
    title: 'Sfaturi pentru pui de cățel',
    body: 'Am luat un cățel de 2 luni și aș vrea sfaturi despre hrănire și vaccinuri.',
    category: 'health',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    comments_count: 3,
    ...overrides,
  };
}

function validPost(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Recomandări veterinar în Cluj',
    body: 'Căutam un veterinar bun pentru pisica mea senior, cu experiență în boli renale. Mulțumesc!',
    category: 'health',
    ...overrides,
  };
}

describe('ForumPostSchema', () => {
  it('acceptă postare validă', () => {
    expect(ForumPostSchema.safeParse(validPost()).success).toBe(true);
  });

  it('respinge titlu prea scurt', () => {
    expect(ForumPostSchema.safeParse(validPost({ title: 'ab' })).success).toBe(false);
  });

  it('respinge corp prea scurt (minim 10)', () => {
    expect(ForumPostSchema.safeParse(validPost({ body: 'scurt' })).success).toBe(false);
  });

  it('respinge corp prea lung', () => {
    expect(ForumPostSchema.safeParse(validPost({ body: 'x'.repeat(2001) })).success).toBe(false);
  });

  it('respinge categorie invalidă', () => {
    expect(ForumPostSchema.safeParse(validPost({ category: 'gossip' })).success).toBe(false);
  });

  it('trim spațiile', () => {
    const r = ForumPostSchema.safeParse(validPost({ title: '  Titlu cu spații  ' }));
    if (r.success) expect(r.data.title).toBe('Titlu cu spații');
    else fail('ar trebui să treacă');
  });
});

describe('ForumCommentSchema', () => {
  it('acceptă comentariu valid', () => {
    expect(
      ForumCommentSchema.safeParse({
        post_id: '11111111-1111-1111-1111-111111111111',
        body: 'Mulțumesc pentru sfaturi!',
      }).success
    ).toBe(true);
  });

  it('respinge comentariu prea scurt', () => {
    expect(
      ForumCommentSchema.safeParse({
        post_id: '11111111-1111-1111-1111-111111111111',
        body: 'x',
      }).success
    ).toBe(false);
  });

  it('respinge uuid invalid', () => {
    expect(
      ForumCommentSchema.safeParse({ post_id: 'abc', body: 'Comentariu valid' }).success
    ).toBe(false);
  });
});

describe('utils connect', () => {
  it('connectCategoryKey — directo + alias RO + fallback', () => {
    expect(connectCategoryKey('health')).toBe('health');
    expect(connectCategoryKey('dresaj')).toBe('training');
    expect(connectCategoryKey('Prezentări')).toBe('present');
    expect(connectCategoryKey('pierdut')).toBe('lost_found');
    expect(connectCategoryKey('random')).toBe('general');
    expect(connectCategoryKey(null)).toBe('general');
  });

  it('filterPosts — categorie + căutare diacritice-insensibilă', () => {
    const posts = [
      makePost(),
      makePost({ id: 'f2', title: 'Pierdut pisică în Florești', category: 'lost_found', body: 'Cățelușa mea a fost pierdută ieri în zonă.' }),
      makePost({ id: 'f3', title: 'Rețete biscuiți pentru câini', category: 'nutrition', body: 'Idei de gustări sănătoase' }),
    ];
    const r1 = filterPosts(posts, { category: 'lost_found' });
    expect(r1.map((p) => p.id)).toEqual(['f2']);

    const r2 = filterPosts(posts, { search: 'hrănire' });
    expect(r2.map((p) => p.id)).toEqual(['f1']);

    const r3 = filterPosts(posts, { search: 'GUSTARI' });
    expect(r3.map((p) => p.id)).toEqual(['f3']);
  });

  it('sortPosts — cele mai recente primele', () => {
    const posts = [
      makePost({ id: 'a', updated_at: '2026-06-01T10:00:00Z' }),
      makePost({ id: 'b', updated_at: '2026-06-10T10:00:00Z' }),
      makePost({ id: 'c', updated_at: '2026-06-05T10:00:00Z' }),
    ];
    expect(sortPosts(posts).map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });

  it('postExcerpt — fără tăiere cuvinte', () => {
    const body = 'Aceasta este o propoziție lungă care ar trebui tăiată frumos la spațiu';
    const ex = postExcerpt(body, 30);
    expect(ex).toBeTruthy();
    expect(ex!.endsWith('…')).toBe(true);
    const cut = ex!.slice(0, -1);
    // nu se termină în mijlocul unui cuvânt (nu se termină cu literă dintr-un cuvânt tăiat)
    expect(cut.split(' ').pop()!.length).toBeGreaterThan(0);
    expect(postExcerpt('scurt')).toBe('scurt');
    expect(postExcerpt(null)).toBeNull();
  });
});
