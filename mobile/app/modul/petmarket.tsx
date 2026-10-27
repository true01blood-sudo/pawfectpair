/**
 * Modulul PetMarket — marketplace de produse pentru animale.
 * Vânzătorii publică anunțuri (cu foto, stoc, condiție, oraș);
 * cumpărătorii plasează comenzi; vânzătorul confirmă și expediază.
 *
 * Tab-uri: Piața | Anunțurile mele | Comenzile mele
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
  MARKET_CATEGORIES,
  MARKET_CATEGORY_EMOJI,
  MARKET_CONDITIONS,
  type MarketCategory,
  type MarketCondition,
  type MarketOrderStatus,
  type MarketProductWithSeller,
  type MarketOrderWithItems,
  type MarketProduct,
} from '@pawfectpair/shared';
import {
  filterProducts,
  sortProducts,
  canTransitionOrder,
  formatPrice,
  categoryKey,
} from '@pawfectpair/shared';
import { MarketOrderSchema } from '@pawfectpair/shared';
import {
  useMarketProducts,
  useMyProducts,
  useMyOrders,
  useSellerOrderItems,
  useMarketRefreshOnFocus,
  useCreateProduct,
  useUpdateProduct,
  useSetProductStatus,
  useDeleteProduct,
  useCreateOrder,
  useSetOrderStatus,
} from '../../hooks/useMarket';
import type { SellerOrderItem } from '../../lib/supabase/queries';
import { pickFromGallery, type PickedImage } from '../../lib/image-picker';
import { uploadPetPhoto } from '../../lib/supabase/queries';
import { useAuthStore } from '../../store/auth.store';

type TabId = 'explore' | 'listings' | 'orders';

/** Tipul funcției de traducere (compatibil react-i18next v15) */
type TFn = ReturnType<typeof useTranslation>['t'];

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

function fmtDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

const ORDER_STATUS_COLOR: Record<MarketOrderStatus, 'warning' | 'primary' | 'success' | 'danger' | 'muted'> = {
  pending: 'warning',
  paid: 'primary',
  shipped: 'primary',
  completed: 'success',
  cancelled: 'muted',
};

interface ProductFormState {
  name: string;
  description: string;
  category: MarketCategory;
  priceRon: string;
  stock: string;
  condition: MarketCondition;
  city: string;
  delivery_info: string;
  photo_url: string | null;
}

function emptyForm(): ProductFormState {
  return {
    name: '',
    description: '',
    category: 'food',
    priceRon: '',
    stock: '1',
    condition: 'new',
    city: '',
    delivery_info: '',
    photo_url: null,
  };
}

function productToForm(p: MarketProduct): ProductFormState {
  return {
    name: p.name,
    description: p.description ?? '',
    category: categoryKey(p.category),
    priceRon: (p.price_cents / 100).toFixed(0),
    stock: String(p.stock ?? 0),
    condition: p.condition ?? 'used',
    city: p.city ?? '',
    delivery_info: p.delivery_info ?? '',
    photo_url: p.photo_url,
  };
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

function OrderStatusBadge({
  status,
  theme,
  t,
}: {
  status: MarketOrderStatus;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
}) {
  const c = ORDER_STATUS_COLOR[status];
  const color =
    c === 'warning' ? theme.colors.warning
    : c === 'primary' ? theme.colors.primary
    : c === 'success' ? theme.colors.success
    : c === 'danger' ? theme.colors.danger
    : theme.colors.textMuted;
  return (
    <View style={[styles.statusBadge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={{ color, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyBold }}>
        {t(`market.order_${status}`)}
      </Text>
    </View>
  );
}

// ============================================================
// Card produs (piața)
// ============================================================

function ProductCard({
  product,
  theme,
  t,
  locale,
  isMine,
  onBuy,
  onDetails,
}: {
  product: MarketProductWithSeller;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  isMine: boolean;
  onBuy: () => void;
  onDetails: () => void;
}) {
  const stockOut = (product.stock ?? 0) <= 0;
  return (
    <Card style={styles.cardGap}>
      <TouchableOpacity activeOpacity={0.85} onPress={onDetails}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={{ fontSize: 22 }}>{MARKET_CATEGORY_EMOJI[categoryKey(product.category)]}</Text>
            <View style={styles.cardTitleText}>
              <Text
                style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeMd, fontFamily: theme.typography.fontFamilyBold }}
                numberOfLines={2}
              >
                {product.name}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }} numberOfLines={1}>
                📍 {product.city ?? '—'}
                {product.seller?.full_name ? ` · ${product.seller.full_name}` : ''}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}>
              <Text style={{ color: theme.colors.primaryDark, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyBold }}>
                {formatPrice(product.price_cents, locale)}
              </Text>
            </View>
          </View>
        </View>

        {product.photo_url ? (
          <Image
            source={{ uri: product.photo_url }}
            style={{ width: '100%', height: 140, borderRadius: theme.radius.md, marginBottom: theme.spacing.sm }}
            contentFit="cover"
          />
        ) : null}

        <View style={styles.wrapRow}>
          <View style={[styles.serviceChip, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
              {MARKET_CATEGORY_EMOJI[categoryKey(product.category)]} {t(`market.cat_${categoryKey(product.category)}`)}
            </Text>
          </View>
          <View style={[styles.serviceChip, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
              {t(`market.cond_${product.condition ?? 'used'}`)}
            </Text>
          </View>
          {stockOut ? (
            <View style={[styles.serviceChip, { backgroundColor: theme.colors.danger + '22' }]}>
              <Text style={{ color: theme.colors.danger, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyBold }}>
                {t('market.sold_out')}
              </Text>
            </View>
          ) : (
            <View style={[styles.serviceChip, { backgroundColor: theme.colors.surfaceAlt }]}>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                {t('market.stock_count', { n: product.stock ?? 0 })}
              </Text>
            </View>
          )}
        </View>

        {product.description ? (
          <Text
            style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm, marginTop: theme.spacing.sm }}
            numberOfLines={2}
          >
            {product.description}
          </Text>
        ) : null}
      </TouchableOpacity>

      <View style={[styles.actionsRow, { marginTop: theme.spacing.sm }]}>
        <Button title={t('market.details')} size="sm" variant="outline" onPress={onDetails} style={{ flex: 1 }} />
        {!isMine && !stockOut && (
          <Button title={t('market.buy')} size="sm" onPress={onBuy} style={{ flex: 1 }} />
        )}
      </View>
    </Card>
  );
}

// ============================================================
// Modal detaliu produs
// ============================================================

function ProductDetailModal({
  visible,
  product,
  theme,
  t,
  locale,
  onClose,
  onBuy,
}: {
  visible: boolean;
  product: MarketProductWithSeller | null;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  onClose: () => void;
  onBuy: (p: MarketProductWithSeller) => void;
}) {
  if (!product) return <Modal visible={false} transparent />;
  return (
    <ModalShell visible={visible} onClose={onClose} title={t('market.detail_title')} theme={theme}>
      {product.photo_url ? (
        <Image
          source={{ uri: product.photo_url }}
          style={{ width: '100%', height: 170, borderRadius: theme.radius.md }}
          contentFit="cover"
        />
      ) : null}

      <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold }}>
        {formatPrice(product.price_cents, locale)}
      </Text>
      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeLg, fontFamily: theme.typography.fontFamilyBold }}>
        {product.name}
      </Text>

      <View style={styles.wrapRow}>
        <View style={[styles.serviceChip, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
            {MARKET_CATEGORY_EMOJI[categoryKey(product.category)]} {t(`market.cat_${categoryKey(product.category)}`)}
          </Text>
        </View>
        <View style={[styles.serviceChip, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
            {t(`market.cond_${product.condition ?? 'used'}`)}
          </Text>
        </View>
        <View style={[styles.serviceChip, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
            {t('market.stock_count', { n: product.stock ?? 0 })}
          </Text>
        </View>
      </View>

      {product.description ? (
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm }}>
          {product.description}
        </Text>
      ) : null}

      <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
        📍 {product.city ?? '—'} · {t('market.published_on', { date: fmtDate(product.created_at, locale) })}
      </Text>

      {product.delivery_info ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
          🚚 {product.delivery_info}
        </Text>
      ) : null}

      {(product.stock ?? 0) > 0 && (
        <Button
          title={`${t('market.buy')} · ${formatPrice(product.price_cents, locale)}`}
          onPress={() => onBuy(product)}
          fullWidth
          size="lg"
        />
      )}
    </ModalShell>
  );
}

// ============================================================
// Modal cumpărare
// ============================================================

function BuyModal({
  visible,
  product,
  theme,
  t,
  locale,
  onClose,
  submitting,
  onConfirm,
}: {
  visible: boolean;
  product: MarketProductWithSeller | null;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  locale: string;
  onClose: () => void;
  submitting: boolean;
  onConfirm: (quantity: number) => void;
}) {
  const [qty, setQty] = useState('1');
  const [err, setErr] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setQty('1');
      setErr(null);
    }
  }, [visible]);

  const maxQty = Math.min(10, product?.stock ?? 1);
  const qtyNum = parseInt(qty, 10);
  const qtyValid = Number.isInteger(qtyNum) && qtyNum >= 1 && qtyNum <= maxQty;
  const total = product && qtyValid ? product.price_cents * qtyNum : null;

  function submit() {
    if (!qtyValid) {
      setErr(t('market.err_qty', { n: maxQty }));
      return;
    }
    onConfirm(qtyNum);
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={t('market.buy_title')} theme={theme}>
      {product && (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
          {MARKET_CATEGORY_EMOJI[categoryKey(product.category)]} {product.name} · {formatPrice(product.price_cents, locale)}
        </Text>
      )}

      <View style={styles.inlineRow}>
        <View style={{ flex: 1 }}>
          <Input
            label={t('market.qty_label')}
            placeholder="1"
            value={qty}
            onChangeText={(v) => setQty(v.replace(/[^0-9]/g, ''))}
            maxLength={2}
            keyboardType="number-pad"
            error={err ?? undefined}
          />
        </View>
        <View style={styles.qtyHint}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
            {t('market.qty_max', { n: maxQty })}
          </Text>
        </View>
      </View>

      {total != null && product && (
        <Text style={{ color: theme.colors.primary, fontSize: theme.typography.fontSizeMd, fontFamily: theme.typography.fontFamilyBold }}>
          {t('market.total')}: {formatPrice(total, locale)}
        </Text>
      )}

      <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
        {t('market.buy_hint')}
      </Text>

      <Button title={t('market.buy_confirm')} onPress={submit} loading={submitting} fullWidth size="lg" />
    </ModalShell>
  );
}

// ============================================================
// Modal formular produs (creare/editare)
// ============================================================

function ProductFormModal({
  visible,
  existing,
  theme,
  t,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  existing: MarketProduct | null;
  theme: ReturnType<typeof useAppTheme>;
  t: TFn;
  onClose: () => void;
  onSave: (state: ProductFormState) => void;
  saving: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setForm(existing ? productToForm(existing) : emptyForm());
      setErrors({});
    }
  }, [visible, existing]);

  function set<K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handlePhoto() {
    try {
      setUploading(true);
      const picked: PickedImage | null = await pickFromGallery();
      if (!picked) return;
      if (!user) throw new Error('auth');
      const url = await uploadPetPhoto(picked.uri, user.id, picked.ext);
      set('photo_url', url);
    } catch {
      RNAlert.alert(t('market.photo_err_title'), t('market.photo_err_msg'));
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = t('market.err_name');
    if (form.city.trim().length < 2) e.city = t('market.err_city');
    const price = Number(form.priceRon);
    if (!form.priceRon.trim() || isNaN(price) || price < 0) e.priceRon = t('market.err_price');
    const stock = Number(form.stock);
    if (form.stock === '' || isNaN(stock) || stock < 0 || !Number.isInteger(stock)) e.stock = t('market.err_stock');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onSave(form);
  }

  return (
    <ModalShell visible={visible} onClose={onClose} title={existing ? t('market.form_title_edit') : t('market.form_title_new')} theme={theme}>
      <Input label={t('market.f_name')} placeholder={t('market.f_name_ph')} value={form.name} onChangeText={(v) => set('name', v)} maxLength={80} error={errors.name} />

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
        {t('market.f_category')}
      </Text>
      <View style={styles.wrapRow}>
        {MARKET_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={`${MARKET_CATEGORY_EMOJI[c]} ${t(`market.cat_${c}`)}`}
            active={form.category === c}
            onPress={() => set('category', c)}
            theme={theme}
          />
        ))}
      </View>

      <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyMedium }}>
        {t('market.f_condition')}
      </Text>
      <View style={styles.wrapRow}>
        {MARKET_CONDITIONS.map((c) => (
          <Chip
            key={c}
            label={t(`market.cond_${c}`)}
            active={form.condition === c}
            onPress={() => set('condition', c)}
            theme={theme}
          />
        ))}
      </View>

      <View style={styles.inlineRow}>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Input label={t('market.f_price')} placeholder="0" value={form.priceRon} onChangeText={(v) => set('priceRon', v.replace(/[^0-9.]/g, ''))} maxLength={7} keyboardType="decimal-pad" error={errors.priceRon} />
        </View>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Input label={t('market.f_stock')} placeholder="1" value={form.stock} onChangeText={(v) => set('stock', v.replace(/[^0-9]/g, ''))} maxLength={4} keyboardType="number-pad" error={errors.stock} />
        </View>
      </View>

      <Input label={t('market.f_city')} placeholder={t('market.f_city_ph')} value={form.city} onChangeText={(v) => set('city', v)} maxLength={60} error={errors.city} />
      <Input label={t('market.f_delivery')} placeholder={t('market.f_delivery_ph')} value={form.delivery_info} onChangeText={(v) => set('delivery_info', v)} maxLength={300} />
      <Input label={t('market.f_desc')} placeholder={t('market.f_desc_ph')} value={form.description} onChangeText={(v) => set('description', v)} maxLength={800} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />

      <View style={styles.photoRow}>
        {form.photo_url ? (
          <Image source={{ uri: form.photo_url }} style={styles.photoPlaceholder} contentFit="cover" />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={{ fontSize: 24 }}>🖼️</Text>
          </View>
        )}
        <Button title={form.photo_url ? t('market.photo_changing') : t('market.photo_pick')} size="sm" variant="outline" loading={uploading} onPress={handlePhoto} />
      </View>

      <Button title={t('common.save')} onPress={submit} loading={saving} fullWidth size="lg" />
    </ModalShell>
  );
}

// ============================================================
// Ecran principal
// ============================================================

export default function PetMarketScreen() {
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'ro';
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';

  const [tab, setTab] = useState<TabId>('explore');
  const [category, setCategory] = useState<MarketCategory | null>(null);
  const [condition, setCondition] = useState<MarketCondition | null>(null);
  const [search, setSearch] = useState('');
  const [detailFor, setDetailFor] = useState<MarketProductWithSeller | null>(null);
  const [buyFor, setBuyFor] = useState<MarketProductWithSeller | null>(null);
  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState<MarketProduct | null>(null);

  useMarketRefreshOnFocus();

  const productsQ = useMarketProducts({ category, condition });
  const myProductsQ = useMyProducts();
  const myOrdersQ = useMyOrders();
  const sellerItemsQ = useSellerOrderItems();

  const createProductM = useCreateProduct();
  const updateProductM = useUpdateProduct();
  const setProductStatusM = useSetProductStatus();
  const deleteProductM = useDeleteProduct();
  const createOrderM = useCreateOrder();
  const setOrderStatusM = useSetOrderStatus();

  const visibleProducts = useMemo(() => {
    const sorted = sortProducts(productsQ.data ?? []);
    return filterProducts(sorted, { search });
  }, [productsQ.data, search]);

  const myOrders = useMemo(() => myOrdersQ.data ?? [], [myOrdersQ.data]);
  const sellerItems = useMemo(() => sellerItemsQ.data ?? [], [sellerItemsQ.data]);
  const myProductIds = useMemo(() => new Set((myProductsQ.data ?? []).map((p) => p.id)), [myProductsQ.data]);
  const pendingSellerCount = sellerItems.filter((it) => it.order?.status === 'pending').length;

  function handleBuy(qty: number) {
    if (!buyFor) return;
    createOrderM.mutate(
      { product_id: buyFor.id, quantity: qty },
      {
        onSuccess: () => {
          setBuyFor(null);
          setDetailFor(null);
          RNAlert.alert(t('market.order_ok_title'), t('market.order_ok_msg'));
          setTab('orders');
        },
        onError: (e: Error) => {
          RNAlert.alert(t('market.order_err_title'), e.message ?? t('market.order_err_msg'));
        },
      }
    );
  }

  async function handleSaveProduct(form: ProductFormState) {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      price_cents: Math.round(Number(form.priceRon) * 100),
      stock: Number(form.stock),
      condition: form.condition,
      city: form.city.trim(),
      delivery_info: form.delivery_info.trim() || null,
      photo_url: form.photo_url,
    };
    try {
      if (editing) {
        await updateProductM.mutateAsync({ id: editing.id, input: payload });
      } else {
        await createProductM.mutateAsync(payload);
      }
      setFormModal(false);
      setEditing(null);
      setTab('listings');
    } catch (e: any) {
      RNAlert.alert(t('market.form_err_title'), e?.message ?? t('market.form_err_msg'));
    }
  }

  function orderAction(order: MarketOrderWithItems, next: MarketOrderStatus) {
    if (!canTransitionOrder(order.status, next)) return;
    setOrderStatusM.mutate({ id: order.id, status: next });
  }

  function sellerAction(item: SellerOrderItem, next: MarketOrderStatus) {
    const current = item.order?.status;
    if (!current || !canTransitionOrder(current, next)) return;
    setOrderStatusM.mutate({ id: item.order_id, status: next });
  }

  const errProducts = productsQ.error ? (productsQ.error as Error).message : null;

  const TABS: { id: TabId; label: string }[] = [
    { id: 'explore', label: t('market.tab_explore') },
    { id: 'listings', label: t('market.tab_listings') },
    { id: 'orders', label: pendingSellerCount > 0 ? `${t('market.tab_orders')} (${pendingSellerCount})` : t('market.tab_orders') },
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

      {tab === 'explore' && (
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeSm }}>
            {t('market.intro')}
          </Text>

          <View style={styles.wrapRow}>
            <Chip label={t('market.cat_all')} active={category === null} onPress={() => setCategory(null)} theme={theme} />
            {MARKET_CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={`${MARKET_CATEGORY_EMOJI[c]} ${t(`market.cat_${c}`)}`}
                active={category === c}
                onPress={() => setCategory(category === c ? null : c)}
                theme={theme}
              />
            ))}
          </View>

          <View style={styles.wrapRow}>
            <Chip label={t('market.cond_all')} active={condition === null} onPress={() => setCondition(null)} theme={theme} />
            {MARKET_CONDITIONS.map((c) => (
              <Chip
                key={c}
                label={t(`market.cond_${c}`)}
                active={condition === c}
                onPress={() => setCondition(condition === c ? null : c)}
                theme={theme}
              />
            ))}
          </View>

          <Input
            label={t('market.search_label')}
            placeholder={t('market.search_ph')}
            value={search}
            onChangeText={setSearch}
            maxLength={60}
          />

          <View style={{ gap: theme.spacing.md }}>
            <StateView loading={productsQ.isLoading} error={errProducts} empty={!errProducts && visibleProducts.length === 0} emoji="🛍️" title={t('market.none_title')} description={t('market.none_desc')}>
              {visibleProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  theme={theme}
                  t={t}
                  locale={locale}
                  isMine={p.seller_id === uid || myProductIds.has(p.id)}
                  onBuy={() => setBuyFor(p)}
                  onDetails={() => setDetailFor(p)}
                />
              ))}
            </StateView>
            {errProducts ? (
              <Button title={t('common.retry')} variant="outline" onPress={() => productsQ.refetch()} />
            ) : null}
          </View>
        </ScrollView>
      )}

      {tab === 'listings' && (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <SectionTitle text={t('market.my_listings_title')} theme={theme} />

          {(myProductsQ.data ?? []).length === 0 && (
            <Card>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, marginBottom: theme.spacing.md }}>
                {t('market.listings_pitch')}
              </Text>
              <Button title={t('market.listings_pitch_cta')} onPress={() => { setEditing(null); setFormModal(true); }} fullWidth />
            </Card>
          )}

          <StateView loading={myProductsQ.isLoading} error={myProductsQ.error ? (myProductsQ.error as Error).message : null} empty={(myProductsQ.data ?? []).length === 0} emoji="🏷️" title={t('market.my_none_title')} description={t('market.my_none_desc')}>
            {(myProductsQ.data ?? []).map((p) => (
              <Card key={p.id} style={styles.cardGap}>
                <View style={styles.cardTitleRow}>
                  <Text style={{ fontSize: 20 }}>{MARKET_CATEGORY_EMOJI[categoryKey(p.category)]}</Text>
                  <View style={styles.cardTitleText}>
                    <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyBold }} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                      {formatPrice(p.price_cents, locale)} · {t('market.stock_count', { n: p.stock ?? 0 })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: p.status === 'sold' ? theme.colors.danger + '22' : theme.colors.success + '22', borderColor: p.status === 'sold' ? theme.colors.danger : theme.colors.success }]}>
                    <Text style={{ color: p.status === 'sold' ? theme.colors.danger : theme.colors.success, fontSize: theme.typography.fontSizeXs, fontFamily: theme.typography.fontFamilyBold }}>
                      {p.status === 'sold' ? t('market.p_sold') : t('market.p_active')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.actionsRow, { marginTop: theme.spacing.sm }]}>
                  <Button
                    title={p.status === 'sold' ? t('market.relist') : t('market.mark_sold')}
                    size="sm"
                    variant="outline"
                    loading={setProductStatusM.isPending}
                    onPress={() => setProductStatusM.mutate({ id: p.id, status: p.status === 'sold' ? 'active' : 'sold' })}
                    style={{ flex: 1 }}
                  />
                  <Button title={t('common.edit')} size="sm" variant="outline" onPress={() => { setEditing(p); setFormModal(true); }} style={{ flex: 1 }} />
                  <Button
                    title={t('common.delete')}
                    size="sm"
                    variant="danger"
                    onPress={() =>
                      RNAlert.alert(t('market.delete_confirm_title'), t('market.delete_confirm_msg'), [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('common.delete'), style: 'destructive', onPress: () => deleteProductM.mutate(p.id) },
                      ])
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))}
          </StateView>

          {(myProductsQ.data ?? []).length > 0 && (
            <Button
              title={t('market.new_product')}
              onPress={() => { setEditing(null); setFormModal(true); }}
              variant="outline"
              fullWidth
            />
          )}
        </ScrollView>
      )}

      {tab === 'orders' && (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48, gap: theme.spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          <SectionTitle text={t('market.my_orders_title')} theme={theme} />
          <StateView loading={myOrdersQ.isLoading} error={myOrdersQ.error ? (myOrdersQ.error as Error).message : null} empty={myOrders.length === 0} emoji="🧾" title={t('market.orders_none')} description={t('market.orders_none_desc')}>
            {myOrders.map((o) => (
              <Card key={o.id} style={styles.cardGap}>
                <View style={styles.cardTitleRow}>
                  <Text style={{ fontSize: 18 }}>🧾</Text>
                  <View style={styles.cardTitleText}>
                    <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyBold }}>
                      {formatPrice(o.total_cents, locale)}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                      {fmtDate(o.created_at, locale)}
                    </Text>
                  </View>
                  <OrderStatusBadge status={o.status} theme={theme} t={t} />
                </View>
                {(o.items ?? []).map((it) => (
                  <View key={it.id} style={styles.itemRow}>
                    <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeXs, flex: 1 }} numberOfLines={1}>
                      {it.quantity} × {it.product?.name ?? `#${it.product_id.slice(0, 8)}`}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }}>
                      {formatPrice(it.quantity * it.unit_price_cents, locale)}
                    </Text>
                  </View>
                ))}
                {o.status === 'pending' && (
                  <Button
                    title={t('market.cancel_order')}
                    size="sm"
                    variant="danger"
                    loading={setOrderStatusM.isPending}
                    onPress={() =>
                      RNAlert.alert(t('market.cancel_confirm_title'), t('market.cancel_confirm_msg'), [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('market.order_cancel'), style: 'destructive', onPress: () => orderAction(o, 'cancelled') },
                      ])
                    }
                  />
                )}
              </Card>
            ))}
          </StateView>

          <SectionTitle text={t('market.seller_title')} theme={theme} />
          <StateView loading={sellerItemsQ.isLoading} error={sellerItemsQ.error ? (sellerItemsQ.error as Error).message : null} empty={sellerItems.length === 0} emoji="📨" title={t('market.seller_none')} description={t('market.seller_none_desc')}>
            {sellerItems.map((it) => (
              <Card key={it.id} style={styles.cardGap}>
                <View style={styles.cardTitleRow}>
                  <Text style={{ fontSize: 18 }}>🛍️</Text>
                  <View style={styles.cardTitleText}>
                    <Text style={{ color: theme.colors.text, fontSize: theme.typography.fontSizeSm, fontFamily: theme.typography.fontFamilyBold }} numberOfLines={1}>
                      {it.quantity} × {it.product?.name ?? '—'}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSizeXs }} numberOfLines={1}>
                      {it.order?.buyer?.full_name ?? '—'} · {formatPrice(it.quantity * it.unit_price_cents, locale)}
                    </Text>
                  </View>
                  {it.order && <OrderStatusBadge status={it.order.status} theme={theme} t={t} />}
                </View>
                {it.order && (
                  <View style={[styles.actionsRow, { marginTop: theme.spacing.sm }]}>
                    {canTransitionOrder(it.order.status, 'paid') && (
                      <Button title={t('market.mark_paid')} size="sm" variant="outline" onPress={() => sellerAction(it, 'paid')} style={{ flex: 1 }} />
                    )}
                    {canTransitionOrder(it.order.status, 'shipped') && (
                      <Button title={t('market.mark_shipped')} size="sm" variant="outline" onPress={() => sellerAction(it, 'shipped')} style={{ flex: 1 }} />
                    )}
                    {canTransitionOrder(it.order.status, 'completed') && (
                      <Button title={t('market.mark_completed')} size="sm" onPress={() => sellerAction(it, 'completed')} style={{ flex: 1 }} />
                    )}
                    {canTransitionOrder(it.order.status, 'cancelled') && (
                      <Button title={t('market.order_cancel')} size="sm" variant="danger" onPress={() => sellerAction(it, 'cancelled')} style={{ flex: 1 }} />
                    )}
                  </View>
                )}
              </Card>
            ))}
          </StateView>
        </ScrollView>
      )}

      {/* FAB doar pe explore + listings */}
      {tab !== 'orders' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            haptic();
            setEditing(null);
            setFormModal(true);
          }}
        >
          <Text style={{ color: theme.colors.textInverse, fontSize: 26 }}>＋</Text>
        </TouchableOpacity>
      )}

      <ProductDetailModal
        visible={!!detailFor}
        product={detailFor}
        theme={theme}
        t={t}
        locale={locale}
        onClose={() => setDetailFor(null)}
        onBuy={(p) => setBuyFor(p)}
      />

      <BuyModal
        visible={!!buyFor}
        product={buyFor}
        theme={theme}
        t={t}
        locale={locale}
        onClose={() => setBuyFor(null)}
        submitting={createOrderM.isPending}
        onConfirm={handleBuy}
      />

      <ProductFormModal
        visible={formModal}
        existing={editing}
        theme={theme}
        t={t}
        onClose={() => { setFormModal(false); setEditing(null); }}
        onSave={handleSaveProduct}
        saving={createProductM.isPending || updateProductM.isPending}
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
  cardHeader: { marginBottom: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitleText: { flex: 1 },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
  },
  qtyHint: {
    justifyContent: 'flex-end',
    paddingBottom: 12,
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
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
