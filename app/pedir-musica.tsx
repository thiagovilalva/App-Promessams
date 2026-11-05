import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getApiBaseUrl } from "@/constants/oauth";

type Song = { id: string; title: string; searchTitle: string };
type CatalogResponse = {
  songs?: Array<{ id?: unknown; title?: unknown }>;
  updatedAt?: unknown;
};

const CATALOG_CACHE_KEY = "radio-music-catalog-v1";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const prepareSongs = (value: unknown): Song[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; title?: unknown };
    if (
      typeof row.id !== "string" ||
      typeof row.title !== "string" ||
      !row.id ||
      !row.title.trim() ||
      seen.has(row.id)
    )
      return [];
    seen.add(row.id);
    const title = row.title.trim();
    return [{ id: row.id, title, searchTitle: normalize(title) }];
  });
};

export default function PedirMusicaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Song | null>(null);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const applyCatalog = useCallback((value: unknown) => {
    const prepared = prepareSongs(value);
    setSongs(prepared);
    setLoading(false);
    return prepared;
  }, []);

  const fetchCatalog = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/radio-music/catalog`,
        );
        const data = (await response.json()) as CatalogResponse;
        if (!response.ok)
          throw new Error(
            typeof data === "object" &&
              data &&
              "error" in data &&
              typeof (data as { error?: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Catálogo indisponível.",
          );
        const prepared = applyCatalog(data.songs);
        if (!prepared.length)
          throw new Error("O catálogo da rádio está vazio.");
        await AsyncStorage.setItem(
          CATALOG_CACHE_KEY,
          JSON.stringify({
            songs: prepared.map(({ id, title }) => ({ id, title })),
            updatedAt: data.updatedAt ?? new Date().toISOString(),
          }),
        );
      } catch (err) {
        if (!songs.length)
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o catálogo.",
          );
        setLoading(false);
      }
    },
    [applyCatalog, songs.length],
  );

  useEffect(() => {
    let active = true;
    let receivedNetworkCatalog = false;
    let hasUsableCatalog = false;
    const load = async () => {
      const cached = AsyncStorage.getItem(CATALOG_CACHE_KEY)
        .then((raw) => {
          if (!active || receivedNetworkCatalog || !raw) return;
          try {
            const parsed = JSON.parse(raw) as CatalogResponse;
            const prepared = prepareSongs(parsed.songs);
            if (prepared.length) {
              hasUsableCatalog = true;
              applyCatalog(prepared);
            }
          } catch {
            // Ignore an invalid old cache and use the public endpoint below.
          }
        })
        .catch(() => undefined);
      const network = fetch(`${getApiBaseUrl()}/api/radio-music/catalog`)
        .then(async (response) => {
          const data = (await response.json()) as CatalogResponse;
          if (!response.ok)
            throw new Error(
              typeof data === "object" &&
                data &&
                "error" in data &&
                typeof (data as { error?: unknown }).error === "string"
                ? (data as { error: string }).error
                : "Catálogo indisponível.",
            );
          const prepared = prepareSongs(data.songs);
          if (!prepared.length)
            throw new Error("O catálogo da rádio está vazio.");
          receivedNetworkCatalog = true;
          hasUsableCatalog = true;
          if (active) applyCatalog(prepared);
          await AsyncStorage.setItem(
            CATALOG_CACHE_KEY,
            JSON.stringify({
              songs: prepared.map(({ id, title }) => ({ id, title })),
              updatedAt: data.updatedAt ?? new Date().toISOString(),
            }),
          );
        })
        .catch((err: unknown) => {
          if (active) {
            setLoading((current) => (songs.length ? false : current));
            if (!hasUsableCatalog)
              setError(
                err instanceof Error
                  ? err.message
                  : "Não foi possível carregar o catálogo.",
              );
          }
        });
      await Promise.allSettled([cached, network]);
      if (active) setLoading((current) => (songs.length ? false : current));
    };
    void load();
    return () => {
      active = false;
    };
  }, [applyCatalog]);

  const visibleSongs = useMemo(() => {
    const query = normalize(search.trim());
    return query
      ? songs.filter((song) => song.searchTitle.includes(query))
      : songs;
  }, [songs, search]);

  async function sendRequest() {
    if (
      !selected ||
      name.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError("Preencha seu nome e e-mail válido e escolha uma música.");
      return;
    }
    setSending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/radio-music/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            songId: selected.id,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Não foi possível confirmar seu pedido.");
      setMessage(data.message);
      setSelected(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível confirmar seu pedido.",
      );
    } finally {
      setSending(false);
    }
  }

  const inputColor = {
    color: colors.foreground,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  };
  const renderSong = useCallback(
    ({ item }: { item: Song }) => (
      <Pressable
        onPress={() => {
          setSelected(item);
          setError("");
          setMessage("");
        }}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.song,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.songText, { color: colors.foreground }]}>
          {item.title}
        </Text>
        <Text style={[styles.link, { color: colors.primary }]}>Pedir ›</Text>
      </Pressable>
    ),
    [colors.border, colors.foreground, colors.primary, colors.surface],
  );

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <FlatList
        key={selected ? "request-form" : "catalog"}
        data={selected ? [] : visibleSongs}
        keyExtractor={(song) => song.id}
        renderItem={renderSong}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={18}
        maxToRenderPerBatch={24}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() =>
                selected ? setSelected(null) : router.replace("/radio-promessa")
              }
              accessibilityRole="button"
              style={styles.back}
            >
              <Text style={[styles.link, { color: colors.primary }]}>
                Voltar
              </Text>
            </Pressable>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Pedir música
            </Text>
            <Text style={[styles.description, { color: colors.muted }]}>
              Escolha uma música do catálogo e envie seu pedido à Rádio da
              Promessa sem sair desta página.
            </Text>
            {!!message && (
              <Text
                accessibilityRole="alert"
                style={[styles.feedback, { color: colors.success }]}
              >
                {message}
              </Text>
            )}
            {!!error && (
              <Text
                accessibilityRole="alert"
                style={[styles.feedback, { color: colors.error }]}
              >
                {error}
              </Text>
            )}
            {selected ? (
              <View>
                <Text style={[styles.songTitle, { color: colors.foreground }]}>
                  {selected.title}
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={100}
                  placeholder="Seu nome"
                  accessibilityLabel="Seu nome para o pedido"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, inputColor]}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  maxLength={254}
                  placeholder="Seu e-mail"
                  accessibilityLabel="Seu e-mail para o pedido"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, inputColor]}
                />
                <Text style={[styles.notice, { color: colors.muted }]}>
                  Ao enviar, seu nome, e-mail e música escolhida são
                  encaminhados à Rádio da Promessa e ao serviço ConectaSTM para
                  processar o pedido. O PromessaMS não salva esses campos em seu
                  banco de dados.
                </Text>
                <Pressable
                  disabled={sending}
                  onPress={() => void sendRequest()}
                  accessibilityRole="button"
                  style={[
                    styles.submit,
                    {
                      backgroundColor: colors.primary,
                      opacity: sending ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={styles.submitText}>
                    {sending ? "Enviando pedido..." : "Enviar pedido à rádio"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View>
                {loading ? (
                  <View style={styles.loading}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={[styles.notice, { color: colors.muted }]}>
                      Carregando catálogo da rádio...
                    </Text>
                  </View>
                ) : (
                  <>
                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Buscar música ou artista"
                      accessibilityLabel="Buscar música ou artista"
                      placeholderTextColor={colors.muted}
                      style={[styles.input, inputColor]}
                    />
                    <Text style={[styles.notice, { color: colors.muted }]}>
                      {visibleSongs.length} músicas disponíveis
                    </Text>
                  </>
                )}
                {!loading && !songs.length && (
                  <Pressable
                    onPress={() => void fetchCatalog(true)}
                    style={styles.back}
                  >
                    <Text style={[styles.link, { color: colors.primary }]}>
                      Tentar novamente
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL("https://wa.me/556798974072")}
              style={styles.back}
            >
              <Text style={[styles.link, { color: colors.primary }]}>
                Falar com a rádio pelo WhatsApp ↗
              </Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          !loading && !selected ? (
            <Text style={[styles.notice, { color: colors.muted }]}>
              Nenhuma música corresponde à busca.
            </Text>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 40 },
  back: { paddingVertical: 12, alignSelf: "flex-start" },
  link: { fontSize: 15, lineHeight: 23, fontWeight: "800" },
  title: { fontSize: 30, lineHeight: 38, fontWeight: "800" },
  description: { fontSize: 16, lineHeight: 25, marginVertical: 12 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    marginTop: 12,
  },
  notice: { fontSize: 14, lineHeight: 22, marginTop: 12 },
  song: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  songText: { fontSize: 16, lineHeight: 25, flex: 1 },
  songTitle: {
    fontSize: 21,
    lineHeight: 29,
    fontWeight: "800",
    marginBottom: 8,
  },
  submit: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 16,
  },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  feedback: { fontSize: 16, lineHeight: 25, marginVertical: 12 },
  loading: { alignItems: "center", padding: 20 },
  pressed: { opacity: 0.7 },
});
