/**
 * Modulul PetConnect — comunitatea PawfectPair (forum).
 * Feed public cu postări pe categorii, comentarii, prezentări, ajutor.
 *
 * Tab-uri: Feed | Postările mele
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert as RNAlert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Input, Card, StateView } from '../../components/ui';
import {
  CONNECT_CATEGORIES,
  CONNECT_CATEGORY_EMOJI,
  type ConnectCategory,
  type ForumPostWithRefs,
  type ForumPostInput,
} from '@pawfectpair/shared';
import {
  filterPosts,
  sortPosts,
  postExcerpt,
  connectCategoryKey,
} from '@pawfectpair/shared';
import { ForumPostSchema, ForumCommentSchema } from '@pawfectpair/shared';
import {
  useForumPosts,
  useMyForumPosts,
  usePostComments,
  useConnectRefreshOnFocus,
  useCreateForumPost,
  useDeleteForumPost,
  useCreateForumComment,
  useDeleteForumComment,
} from '../../hooks/useConnect';
import { useAuthStore } from '../../store/auth.store';

type TabId = 'feed' | 'mine';

/** Tipul funcției de traducere (compatibil react-i18next v15) */
type TFn = ReturnType<typeof useTranslation>['t'];

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

function fmtDateTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '').toUpperCase();
}

// ============================================================
// Componente mici
// ============================================================

function Chip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        haptic();
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
          borderColor: active ? theme.colors.primaryDark : theme.colors.border,
        },
      ]}
    >
      <Text
        style={{
          color: active ? theme.colors.textInverse : theme.colors.text,
          fontSize: theme.typography.fontSizeSm,
          fontFamily: active ? theme.typography.fontFamilyBold : theme.typography.fontFamilyRegular,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SectionTitle({ text, theme }: { text: string; theme: ReturnType<typeof useAppTheme> }) {
  return (
    <Text
      style={{
        color: theme.colors.text,
        fontSize: theme.typography.fontSizeLg,
        fontFamily: theme.typography.fontFamilyBold,
        marginBottom: theme.spacing.sm,
      }}
    >
      {text}
    </Text>
  );
}

function Avatar({
  uri,
  name,
  theme,
}: {
  uri: string | null | undefined;
  name: string | null | undefined;
  theme: ReturnType<typeof useAppTheme>;
}) {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} contentFit="cover" />;
  }
  return (
    <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: theme.colors.primaryDark, fontSize: 12, fontFamily: theme.typography.fontFamilyBold }}>
        {initials(name)}
      </Text>
    </View>
  );
}

function ModalShell({
  visible,
  onClose,
  title,
  theme,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  theme: ReturnType<typeof useAppTheme>;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
            <View style={styles.sheetHeader}>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold, flex: 1 }}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 22 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.sm, maxWidth: 720, width: '100%', alignSelf: 'center' }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ============================================================
// Card postare
// ============================================================

function PostCard({
  post,
  theme,
  t,
  locale,
  isMine,
  onOpen,
  onDelete,
}: {
  post: ForumPostWithRefs;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  isMine: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const cat = connectCategoryKey(post.category);
  const excerpt = postExcerpt(post.body, 140);
  return (
    <Card style={styles.cardGap}>
      <TouchableOpacity activeOpacity={0.85} onPress={onOpen}>
        <View style={styles.authorRow}>
          <Avatar uri={post.author?.avatar_url} name={post.author?.full_name} theme={theme} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }} numberOfLines={1}>
              {post.author?.full_name ?? t('connect.anonymous')}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
              {fmtDateTime(post.created_at, locale)}
            </Text>
          </View>
          <View style={[styles.catChip, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.fontSizeXs }}>
              {CONNECT_CATEGORY_EMOJI[cat]} {t(`connect.cat_${cat}`)}
            </Text>
          </View>
        </View>

        <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontFamily: theme.typography.fontFamilyBold, marginTop: theme.spacing.sm }}>
          {post.title}
        </Text>

        {excerpt ? (
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, marginTop: 4 }}>
            {excerpt}
          </Text>
        ) : null}
      </TouchableOpacity>

      <View style={[styles.actionsRow, { marginTop: theme.spacing.sm }]}>
        <Button title={`💬 ${t('connect.comments_count', { n: post.comments_count ?? 0 })}`} size="sm" variant="outline" onPress={onOpen} style={{ flex: 1 }} />
        {isMine && (
          <Button
            title={t('common.delete')}
            size="sm"
            variant="danger"
            onPress={onDelete}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </Card>
  );
}

// ============================================================
// Modal detaliu postare + comentarii
// ============================================================

function PostDetailModal({
  visible,
  post,
  theme,
  t,
  locale,
  onClose,
}: {
  visible: boolean;
  post: ForumPostWithRefs | null;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  const [comment, setComment] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const commentsQ = usePostComments(visible && post ? post.id : null);
  const addCommentM = useCreateForumComment();
  const deleteCommentM = useDeleteForumComment();

  React.useEffect(() => {
    if (visible) {
      setComment('');
      setErr(null);
    }
  }, [visible, post]);

  if (!post) return <Modal visible={false} transparent />;
  const cat = connectCategoryKey(post.category);

  function submitComment() {
    const body = comment.trim();
    const parsed = ForumCommentSchema.safeParse({ post_id: post!.id, body });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? t('connect.comment_err'));
      return;
    }
    setErr(null);
    addCommentM.mutate(parsed.data, {
      onSuccess: () => setComment(''),
      onError: (e: Error) => setErr(e.message ?? t('connect.comment_err')),
    });
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={t('connect.detail_title')} theme={theme}>
      <View style={styles.authorRow}>
        <Avatar uri={post.author?.avatar_url} name={post.author?.full_name} theme={theme} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
            {post.author?.full_name ?? t('connect.anonymous')}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
            {fmtDateTime(post.created_at, locale)}
          </Text>
        </View>
        <View style={[styles.catChip, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.fontSizeXs }}>
            {CONNECT_CATEGORY_EMOJI[cat]} {t(`connect.cat_${cat}`)}
          </Text>
        </View>
      </View>

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold }}>
        {post.title}
      </Text>
      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm }}>
        {post.body}
      </Text>

      <SectionTitle text={t('connect.comments_title')} theme={theme} />

      {commentsQ.isLoading ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
          {t('common.loading')}
        </Text>
      ) : (commentsQ.data ?? []).length === 0 ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
          {t('connect.comments_none')}
        </Text>
      ) : (
        (commentsQ.data ?? []).map((c) => (
          <View key={c.id} style={[styles.commentRow, { borderColor: theme.colors.border }]}>
            <Avatar uri={c.author?.avatar_url} name={c.author?.full_name} theme={theme} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={styles.commentHeader}>
                <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyMedium, flex: 1 }} numberOfLines={1}>
                  {c.author?.full_name ?? t('connect.anonymous')}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                  {fmtDateTime(c.created_at, locale)}
                </Text>
              </View>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm }}>
                {c.body}
              </Text>
              {c.author_id === uid && (
                <TouchableOpacity
                  onPress={() =>
                    RNAlert.alert(t('connect.comment_delete_title'), t('connect.comment_delete_msg'), [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('common.delete'), style: 'destructive', onPress: () => deleteCommentM.mutate(c.id) },
                    ])
                  }
                  hitSlop={8}
                >
                  <Text style={{ color: theme.colors.danger, fontSize: theme.typography.fontSizeXs, marginTop: 4 }}>
                    {t('common.delete')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}

      <Input
        label={t('connect.comment_label')}
        placeholder={t('connect.comment_ph')}
        value={comment}
        onChangeText={(v) => setComment(v)}
        maxLength={500}
        multiline
        numberOfLines={2}
        style={{ minHeight: 60, textAlignVertical: 'top' }}
        error={err ?? undefined}
      />
      <Button
        title={t('connect.comment_send')}
        onPress={submitComment}
        loading={addCommentM.isPending}
        fullWidth
      />
    </ModalShell>
  );
}

// ============================================================
// Modal postare nouă
// ============================================================

function NewPostModal({
  visible,
  theme,
  t,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  onClose: () => void;
  onSave: (state: { title: string; body: string; category: ConnectCategory }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<ConnectCategory>('general');
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (visible) {
      setTitle('');
      setBody('');
      setCategory('general');
      setErrors({});
    }
  }, [visible]);

  function submit() {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = t('connect.err_title');
    if (body.trim().length < 10) e.body = t('connect.err_body');
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSave({ title: title.trim(), body: body.trim(), category });
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={t('connect.new_title')} theme={theme}>
      <Input label={t('connect.f_title')} placeholder={t('connect.f_title_ph')} value={title} onChangeText={setTitle} maxLength={100} error={errors.title} />

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
        {t('connect.f_category')}
      </Text>
      <View style={styles.wrapRow}>
        {CONNECT_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={`${CONNECT_CATEGORY_EMOJI[c]} ${t(`connect.cat_${c}`)}`}
            active={category === c}
            onPress={() => setCategory(c)}
            theme={theme}
          />
        ))}
      </View>

      <Input
        label={t('connect.f_body')}
        placeholder={t('connect.f_body_ph')}
        value={body}
        onChangeText={setBody}
        maxLength={2000}
        multiline
        numberOfLines={6}
        style={{ minHeight: 130, textAlignVertical: 'top' }}
        error={errors.body}
      />

      <Button title={t('connect.publish')} onPress={submit} loading={saving} fullWidth size="lg" />
    </ModalShell>
  );
}

// ============================================================
// Ecran principal
// ============================================================

export default function PetConnectScreen() {
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'ro';
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';

  const [tab, setTab] = useState<TabId>('feed');
  const [category, setCategory] = useState<ConnectCategory | null>(null);
  const [search, setSearch] = useState('');
  const [detailFor, setDetailFor] = useState<ForumPostWithRefs | null>(null);
  const [newModal, setNewModal] = useState(false);

  useConnectRefreshOnFocus();

  const postsQ = useForumPosts();
  const myPostsQ = useMyForumPosts();
  const createPostM = useCreateForumPost();
  const deletePostM = useDeleteForumPost();

  const visiblePosts = useMemo(() => {
    const sorted = sortPosts(postsQ.data ?? []);
    return filterPosts(sorted, { category, search });
  }, [postsQ.data, category, search]);

  const myPosts = useMemo(() => sortPosts(myPostsQ.data ?? []), [myPostsQ.data]);

  function handleDeletePost(post: ForumPostWithRefs) {
    RNAlert.alert(t('connect.delete_title'), t('connect.delete_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deletePostM.mutate(post.id) },
    ]);
  }

  async function handleSavePost(state: { title: string; body: string; category: ConnectCategory }) {
    const parsed = ForumPostSchema.safeParse(state);
    if (!parsed.success) {
      RNAlert.alert(t('connect.form_err_title'), parsed.error.issues[0]?.message ?? t('connect.form_err_msg'));
      return;
    }
    try {
      await createPostM.mutateAsync(parsed.data as ForumPostInput);
      setNewModal(false);
      setTab('mine');
    } catch (e: any) {
      RNAlert.alert(t('connect.form_err_title'), e?.message ?? t('connect.form_err_msg'));
    }
  }

  const errPosts = postsQ.error ? (postsQ.error as Error).message : null;

  const TABS: { id: TabId; label: string }[] = [
    { id: 'feed', label: t('connect.tab_feed') },
    { id: 'mine', label: t('connect.tab_mine') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      {/* Tab-uri */}
      <View style={[styles.tabsRow, { backgroundColor: theme.colors.background }]}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.id}
            style={[
              styles.tabBtn,
              {
                backgroundColor: tab === tb.id ? theme.colors.primary : 'transparent',
                borderColor: tab === tb.id ? theme.colors.primary : theme.colors.border,
                flex: 1,
              },
            ]}
            onPress={() => {
              haptic();
              setTab(tb.id);
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: tab === tb.id ? theme.colors.textInverse : theme.colors.text,
                fontSize: theme.typography.fontSizeXs,
                fontFamily: tab === tb.id ? theme.typography.fontFamilyBold : theme.typography.fontFamilyRegular,
              }}
            >
              {tb.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'feed' && (
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
            {t('connect.intro')}
          </Text>

          <View style={styles.wrapRow}>
            <Chip label={t('connect.cat_all')} active={category === null} onPress={() => setCategory(null)} theme={theme} />
            {CONNECT_CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={`${CONNECT_CATEGORY_EMOJI[c]} ${t(`connect.cat_${c}`)}`}
                active={category === c}
                onPress={() => setCategory(category === c ? null : c)}
                theme={theme}
              />
            ))}
          </View>

          <Input
            label={t('connect.search_label')}
            placeholder={t('connect.search_ph')}
            value={search}
            onChangeText={setSearch}
            maxLength={60}
          />

          <View style={{ gap: theme.spacing.md }}>
            <StateView loading={postsQ.isLoading} error={errPosts} empty={!errPosts && visiblePosts.length === 0} emoji="👥" title={t('connect.none_title')} description={t('connect.none_desc')}>
              {visiblePosts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  theme={theme}
                  t={t}
                  locale={locale}
                  isMine={p.author_id === uid}
                  onOpen={() => setDetailFor(p)}
                  onDelete={() => handleDeletePost(p)}
                />
              ))}
            </StateView>
            {errPosts ? (
              <Button title={t('common.retry')} variant="outline" onPress={() => postsQ.refetch()} />
            ) : null}
          </View>
        </ScrollView>
      )}

      {tab === 'mine' && (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <SectionTitle text={t('connect.mine_title')} theme={theme} />

          {(myPostsQ.data ?? []).length === 0 && (
            <Card>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, marginBottom: theme.spacing.md }}>
                {t('connect.mine_pitch')}
              </Text>
              <Button title={t('connect.mine_pitch_cta')} onPress={() => setNewModal(true)} fullWidth />
            </Card>
          )}

          <StateView loading={myPostsQ.isLoading} error={myPostsQ.error ? (myPostsQ.error as Error).message : null} empty={(myPostsQ.data ?? []).length === 0} emoji="📝" title={t('connect.mine_none_title')} description={t('connect.mine_none_desc')}>
            {myPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                theme={theme}
                t={t}
                locale={locale}
                isMine
                onOpen={() => setDetailFor(p)}
                onDelete={() => handleDeletePost(p)}
              />
            ))}
          </StateView>

          {(myPostsQ.data ?? []).length > 0 && (
            <Button title={t('connect.new_post')} onPress={() => setNewModal(true)} variant="outline" fullWidth />
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          haptic();
          setNewModal(true);
        }}
      >
        <Text style={{ color: theme.colors.textInverse, fontSize: 26 }}>＋</Text>
      </TouchableOpacity>

      <PostDetailModal
        visible={!!detailFor}
        post={detailFor}
        theme={theme}
        t={t}
        locale={locale}
        onClose={() => setDetailFor(null)}
      />

      <NewPostModal
        visible={newModal}
        theme={theme}
        t={t}
        onClose={() => setNewModal(false)}
        onSave={handleSavePost}
        saving={createPostM.isPending}
      />
    </SafeAreaView>
  );
}

// ============================================================
// Stiluri
// ============================================================

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  tabBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  cardGap: { marginBottom: 0 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  catChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 130,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  commentRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  kav: { width: '100%' },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
});
