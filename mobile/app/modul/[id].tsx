/**
 * Ecran reutilizabil „Coming soon" pentru modulele Faza 2/3.
 * Arată iconița modulului, numele, descrierea completă (din PDF),
 * și un buton „Anunță-mă când e gata".
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../components/theme-provider';
import { Button, Card } from '../../components/ui';
import { getModuleById } from '../../lib/modules';
import { webModuleUrl } from '@pawfectpair/shared';

/** Conținut extins per modul (descriere lungă din PDF) */
const MODULE_DETAILS: Record<string, { features: string[]; tech: string[] }> = {
  petguardian: {
    features: [
      'Locație în timp real (GPS la 5s live / 5min pasiv)',
      'Geofencing — notificare instant la ieșirea din zona sigură',
      'Istoric mișcări 30 zile + trasee vizuale',
      'Compatibilitate: Tractive, Jiobit, Weenect, Kippy, Pawfit, AirTag',
      'Partajare acces temporar (dog walker) 1-24h',
      'Alerte: inactivitate, furtună, ieșire noaptea',
      'SOS integrat cu PetSOS și PetPlanner',
    ],
    tech: ['expo-location', 'react-native-maps', 'WebSocket pentru live tracking', 'AES-256 + TLS 1.3'],
  },
  petwell: {
    features: [
      'Fișă medicală digitală completă (vaccinuri, tratamente, analize)',
      'Programări + agendă medicală cu remindere automate',
      'Chestionar zilnic de stare (apetit, energie, comportament)',
      'AI Medical Watchdog — detectează devieri de la rutină',
      'Integrare coliere smart (FitBark, PetPace, Whistle)',
      'Nutriție personalizată (AI dietetic + meniu săptămânal)',
      'Urmărire greutate + grafic IMC + alarme obezitate',
      'Conexiune directă cu medicul veterinar',
      'Monitorizare emoțională (scor: relaxat/stresat/letargic)',
    ],
    tech: ['TensorFlow Lite', 'Wearable SDKs', 'FHIR/HL7 export', 'AI sentiment analysis'],
  },
  petedu: {
    features: [
      'Microcursuri interactive (5-10 min) cu video + quiz',
      'Cursuri: „Începem împreună", „Dresaj de bază", „Înțelege pisica", „Boli comune"',
      'Ghiduri tematice (anotimp, alergii, blană, gheare)',
      'Podcasturi narate de veterinari și dresori',
      'AI EduCoach — recomandă lecții pe baza profilului animalului',
      'Cursuri pentru copii cu ilustrații și voci simpatice',
      'Badge-uri, diplome digitale, clasament global',
      'Evenimente live și webinaruri cu specialiști',
    ],
    tech: ['Lottie animations', 'Audio streaming', 'Spaced repetition'],
  },
  petplanner: {
    features: [
      'Calendar centralizat zilnic/săptămânal/lunar',
      'Categorii: rutină zilnică, îngrijire, sănătate, socializare, comenzi',
      'Quick add + planificare multi-animal',
      'Recomandări AI pentru activități optime',
      'Pre-programare automată (vaccinări recurente, sezon)',
      'Notificări dinamice (10min/1h/1zi înainte) + vocale',
      'Mod multi-utilizator (familie partajată)',
      'Sincronizare cu bone, dog walkers, PetMatch',
      'Statistici + rapoarte PDF pentru medici',
    ],
    tech: ['Calendar sync (Google/Apple)', 'Push notifications', 'AI scheduling'],
  },
  petlegacy: {
    features: [
      'Pagină memorial unică per animal (foto, video, audio, scrisoare)',
      'Cronologie a vieții + citat favorit',
      'Secțiune publică „Trimite un gând" (flori virtuale, lumânări)',
      'Jurnal de doliu privat (întrebări empatice)',
      'Album video auto-generat cu muzică',
      'Grupuri de suport moderate de consilieri',
      'Donație în memoria animalului (ONG / copac digital)',
      'Parteneriate artiști (portrete, brățări gravate)',
      'Mesaj automat la 1 an de la pierdere',
    ],
    tech: ['AES-256 encryption', 'Cloud video generation', 'Moderated community'],
  },
  petmarket: {
    features: [
      'Categorii: hrană, accesorii, igienă, servicii, personalizate',
      'SmartShopper AI — recomandări pe baza rasei, vârstei, sănătății',
      'Comenzi recurente + abonamente (hrană lunară)',
      'Căutare geolocalizată magazine locale + express ≤2h',
      'Integrare Tazz / Glovo / FanCourier / Sameday',
      'Plăți: card, Apple Pay, Google Pay, portofel PetCare, rate',
      'Sistem de puncte + cashback + badge-uri loialitate',
      'Cutia lunară PetBox (abonament tematic)',
      'Trasabilitate produse (ingrediente, certificări, rechemări lot)',
    ],
    tech: ['Stripe + Apple/Google Pay', 'Recommender AI', 'Real-time delivery tracking'],
  },
  petevents: {
    features: [
      'Evenimente sociale, educaționale, caritabile, competiții',
      'Hartă interactivă cu filtre (tip, rază, dată, accesibilitate)',
      'Înscriere 1-click + bilet digital QR',
      'Creare evenimente de către utilizatori',
      'Check-in automatizat (verificare vaccinări)',
      'Chat live participanți + galerie foto comună',
      'Feedback post-eveniment + distincții',
      'Marketplace temporar în cadrul evenimentelor',
    ],
    tech: ['Google Maps Places', 'QR codes', 'WebSocket chat'],
  },
  petsos: {
    features: [
      'Buton SOS vizibil pe toate ecranele + comandă vocală + shake detection',
      'Selectare rapidă tip urgență (accident, fugă, simptom acut)',
      'Ghid prim ajutor ilustrat + narat cu cronometru',
      'Clinică veterinară cea mai apropiată + apel automat',
      'Trimite fișa medicală + locația live către clinică',
      'Notificare contacte de urgență + medic curant + ONG',
      'Pentru animal pierdut: alertă comunitară 3 km + afiș PDF',
      'Chat instant cu medic de gardă + AI specializat urgențe',
      'Log de eveniment + raport post-urgență',
    ],
    tech: ['Live location streaming', 'Text-to-speech', 'Community push'],
  },
  petresq: {
    features: [
      'Alerte: animal pierdut / găsit / în pericol / abandonat',
      'Generare alertă în 30 secunde (foto, descriere, locație, recompensă)',
      'Distribuție AI inteligentă către utilizatori relevanți',
      'Hartă dinamică cu coduri color (roșu/verde/galben)',
      'Fișă de intervenție colaborativă + istoric mesaje',
      'Sistem „preia cazul" pentru voluntari',
      'Profil de voluntar (zonă, disponibilitate, capacități)',
      'Recunoaștere facială AI pentru animale (match cu baza pierdute)',
      'Puncte + badge-uri + certificate comunitare',
      'Rapoarte lunare impact (cazuri rezolvate, animale reunite)',
    ],
    tech: ['Image recognition AI', 'Geospatial queries', 'Community moderation'],
  },
  petinsurance: {
    features: [
      '4 planuri: Essentials, Care+, Complete&Protect, AI Tailored',
      'Activare rapidă în 3 pași, contract digital semnat',
      'Rețea clinici partenere + hartă + rating',
      'Verificare acoperire automată la programări',
      'Documente transmise automat asigurator (cu acord)',
      'Panou control: plan activ, intervenții rămase, economii',
      'Notificări inteligente (reînnoire, noi riscuri identificați)',
      'Pachete multi-animal + reduceri progresive',
      'Acoperire temporară UE pentru călătorii',
      '3-6 luni gratuit pentru animale adoptate',
    ],
    tech: ['Stripe billing', 'DocuSign / Adobe Sign', 'AI risk assessment'],
  },
  pettraining: {
    features: [
      'Dresaj de bază (stai, șezi, vino, lăbuța, nu)',
      'Corectare comportamentală (distructiv, lătrat, anxietate)',
      'Stimulare cognitivă (memory, labirinturi, mind games)',
      'Dresaj specializat (pază, terapie, expoziții)',
      'AI TrainerCoach — plan săptămânal personalizat',
      'Lecții: video narat + instrucțiuni pas cu pas + evaluare',
      'Adaptare automată dacă animalul nu progresează',
      'Filmare sesiune + analiză AI poziție corp',
      'Insigne, trofee, competiții lunare cu premii',
      'Module copii (voce jucăușă + animații)',
      'Clicker training avansat + comenzi duble',
    ],
    tech: ['Computer vision pose estimation', 'Spaced repetition', 'Progress tracking'],
  },
  petconnect: {
    features: [
      'Profiluri sociale extinse (stăpân + animal + status zilnic)',
      'Feed personalizat cu reacții emoționale',
      'Cluburi tematice (rasă, locație, stil viață, probleme comune)',
      'Grupuri dinamice temporare (târg adopții, sprijin pierdere)',
      'Forum integrat pe categorii + vot + badge-uri',
      'Jurnale și bloguri personale',
      'AI Social Companion — sugerează interacțiuni',
      'Clasamente locale/globale + top animale vedetă',
      'Moderare AI + echipă reală (anti hate speech)',
      'Live Rooms (transmisii video grupuri)',
    ],
    tech: ['Realtime feed', 'Recommender AI', 'Moderation NLP'],
  },
  petanalytics: {
    features: [
      'Dashboard central: activitate, sănătate, nutriție, dresaj',
      'Wellness Wheel — 6 arii bunăstare vizualizate',
      'Analiză comportamentală (oameni noi, zgomot, alte animale)',
      'Analiză emoțională (frică, bucurie, frustrare, atașament)',
      'Analiză sănătate (corelare simptome + tratamente)',
      'Analiză socializare (frecvență, tip, compatibilitate)',
      'PetPredict — predicție riscuri pe baza rasei + istoric',
      'Rapoarte PDF automate (lunar/trimestrial/anual)',
      'AI Advisor — răspunde la întrebări comportamentale',
      'Compartor populațional (animalul tău vs media națională)',
      'Integrare Google Fit / Apple Health (pentru stăpân)',
    ],
    tech: ['TensorFlow.js', 'Time series analysis', 'FHIR reports'],
  },
  adoptii: {
    features: [
      'Catalog animale disponibile (proximitate, specie, compatibilitate)',
      'Filtre: rasă, vârstă, stare medicală, nivel activitate',
      'Profiluri detaliate (foto, descriere, info medicale, testimoniale)',
      'Salvare favorite + discuție cu centrul de adopție',
      'Proces digital: formulare + semnături electronice + urmărire post-adopție',
      'Raportare animale pierdute/găsite',
      'Adopție la distanță (sponsorizare cu urmărire progres)',
    ],
    tech: ['DocuSign API', 'AI compatibility matching', 'Image gallery'],
  },
};

export default function ModuleComingSoonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslation().t;
  const theme = useAppTheme();
  const mod = getModuleById(id);

  if (!mod) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ padding: 24 }}>
          <Text style={{ color: theme.colors.text }}>Modul necunoscut: {id}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const details = MODULE_DETAILS[id];

  const handleNotify = () => {
    Alert.alert(
      t('modules.notifyMe'),
      'Vei primi o notificare push când acest modul devine disponibil. (Demo — integrare cu push notifications în Faza 2.)',
      [{ text: t('app.close') }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t(`modules.${id}Name` as any) }} />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: mod.color + '22' }]}>
          <View style={[styles.heroIcon, { backgroundColor: mod.color }]}>
            <Text style={{ fontSize: 56 }}>{mod.emoji}</Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
            {t(`modules.${id}Name` as any)}
          </Text>
          <Text style={[styles.heroDesc, { color: theme.colors.textMuted }]}>
            {t(`modules.${id}Desc` as any)}
          </Text>
          <View style={[styles.phasePill, { backgroundColor: mod.phase === 2 ? theme.colors.accent : theme.colors.surfaceAlt }]}>
            <Text style={{ color: mod.phase === 2 ? '#1a1410' : theme.colors.text, fontSize: 12, fontWeight: '700' }}>
              {mod.phase === 1 ? t('modules.faza1') : mod.phase === 2 ? t('modules.faza2') : t('modules.faza3')}
            </Text>
          </View>
        </View>

        {/* Coming soon banner */}
        <Card style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🚧</Text>
          <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>
            {t('modules.comingSoon')}
          </Text>
          <Text style={[styles.bannerDesc, { color: theme.colors.textMuted }]}>
            {t('modules.comingSoonDesc')}
          </Text>
          <Button
            title={`🔔 ${t('modules.notifyMe')}`}
            onPress={handleNotify}
            style={{ marginTop: 16 }}
            size="lg"
          />
          {webModuleUrl(id) && (
            <Button
              title="🌐 pawfectpair.app"
              variant="outline"
              size="sm"
              onPress={() => Linking.openURL(webModuleUrl(id)!).catch(() => {})}
              style={{ marginTop: 10 }}
            />
          )}
        </Card>

        {/* Funcționalități planificate */}
        {details && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: theme.spacing.lg }]}>
              Funcționalități planificate
            </Text>
            <Card>
              {details.features.map((f, i) => (
                <View key={i} style={[styles.featureRow, { borderBottomColor: theme.colors.border }]}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>{mod.emoji}</Text>
                  <Text style={{ color: theme.colors.text, fontSize: 14, flex: 1, lineHeight: 20 }}>{f}</Text>
                </View>
              ))}
            </Card>

            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: theme.spacing.lg }]}>
              Tehnologii planificate
            </Text>
            <View style={styles.techRow}>
              {details.tech.map((tech, i) => (
                <View key={i} style={[styles.techChip, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={{ color: theme.colors.primaryDark, fontSize: 11, fontWeight: '600' }}>{tech}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  phasePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  bannerDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  techChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
});
