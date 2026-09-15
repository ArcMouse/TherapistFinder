import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { therapistApi } from "../../src/api/endpoints";
import { EmptyState, ErrorBanner } from "../../src/components/Banners";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { SearchBar } from "../../src/components/SearchBar";
import { TherapistCard } from "../../src/components/TherapistCard";
import { extractApiError } from "../../src/lib/errors";
import { useAuth } from "../../src/store/auth";

interface Filters {
  tags: string[];
  maxPrice?: number;
  availableFrom?: string;
  availableTo?: string;
}

const PRICE_OPTIONS: { label: string; maxPrice?: number }[] = [
  { label: "Any price" },
  { label: "Under ₹1,000", maxPrice: 1000 },
  { label: "Under ₹2,000", maxPrice: 2000 },
  { label: "Under ₹3,000", maxPrice: 3000 },
];

function dayBounds(offsetDays: number) {
  const start = new Date();
  start.setDate(start.getDate() + offsetDays);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

const DATE_OPTIONS: { label: string; bounds?: { from: string; to: string } }[] = [
  { label: "Any time" },
  { label: "Today", bounds: dayBounds(0) },
  { label: "Tomorrow", bounds: dayBounds(1) },
  { label: "This weekend", bounds: dayBounds((6 - new Date().getDay() + 7) % 7 || 6) },
];

export default function TherapistListScreen() {
  const router = useRouter();
  const user = useAuth((state) => state.user);

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ tags: [] });

  const listParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {};
    if (filters.tags.length) params.tags = filters.tags.join(",");
    if (filters.maxPrice) params.max_price = filters.maxPrice;
    if (filters.availableFrom) params.available_from = filters.availableFrom;
    if (filters.availableTo) params.available_to = filters.availableTo;
    return params;
  }, [filters]);

  const listQuery = useQuery({
    queryKey: ["therapists", listParams],
    queryFn: () => therapistApi.list(listParams),
    enabled: !activeQuery,
  });

  const searchQuery = useQuery({
    queryKey: ["search", activeQuery],
    queryFn: () => therapistApi.search(activeQuery),
    enabled: Boolean(activeQuery),
  });

  const therapists = activeQuery ? searchQuery.data?.results ?? [] : listQuery.data ?? [];
  const loading = activeQuery ? searchQuery.isLoading : listQuery.isLoading;
  const error = activeQuery ? searchQuery.error : listQuery.error;

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    (listQuery.data ?? []).forEach((t) => (t.tags ?? []).forEach((tag) => set.add(tag)));
    const prioritized = ["anxiety", "depression", "teens", "couples", "trauma", "adhd"];
    const all = Array.from(set);
    return all.sort((a, b) => {
      const ai = prioritized.indexOf(a);
      const bi = prioritized.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [listQuery.data]);

  function toggleTag(tag: string) {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  function submitSearch() {
    setActiveQuery(query.trim());
  }

  const header = (
    <View className="px-5 pt-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-surface-400">
            Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </Text>
          <Text className="text-2xl font-bold text-surface-900">Find your therapist</Text>
        </View>
      </View>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={submitSearch}
        placeholder="e.g. anxiety in teens, Sunday evening"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-2"
        contentContainerStyle={{ paddingRight: 12 }}
      >
        {availableTags.slice(0, 8).map((tag) => {
          const active = filters.tags.includes(tag);
          return (
            <Pressable
              key={tag}
              testID={`filter-tag-${tag}`}
              accessibilityRole="button"
              onPress={() => toggleTag(tag)}
              className={`mr-2 rounded-full border px-3 py-1.5 ${
                active ? "border-primary-500 bg-primary-500" : "border-surface-200 bg-white"
              }`}
            >
              <Text className={`text-xs font-medium ${active ? "text-white" : "text-surface-600"}`}>
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{ paddingRight: 12 }}
      >
        {PRICE_OPTIONS.map((option) => {
          const active = filters.maxPrice === option.maxPrice;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              onPress={() => setFilters((prev) => ({ ...prev, maxPrice: option.maxPrice }))}
              className={`mr-2 rounded-full border px-3 py-1.5 ${
                active ? "border-accent-500 bg-accent-50" : "border-surface-200 bg-white"
              }`}
            >
              <Text
                className={`text-xs font-medium ${active ? "text-accent-600" : "text-surface-600"}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
        {DATE_OPTIONS.slice(1).map((option) => {
          const active = filters.availableFrom === option.bounds?.from;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              testID={`date-filter-${option.label.toLowerCase().replace(/\s+/g, "-")}`}
              onPress={() =>
                setFilters((prev) => {
                  const isActive = prev.availableFrom === option.bounds?.from;
                  return {
                    ...prev,
                    availableFrom: isActive ? undefined : option.bounds?.from,
                    availableTo: isActive ? undefined : option.bounds?.to,
                  };
                })
              }
              className={`mr-2 rounded-full border px-3 py-1.5 ${
                active ? "border-primary-500 bg-primary-50" : "border-surface-200 bg-white"
              }`}
            >
              <Text
                className={`text-xs font-medium ${active ? "text-primary-600" : "text-surface-600"}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-surface-600">
          {loading ? "Searching…" : `${therapists.length} therapist${therapists.length === 1 ? "" : "s"}`}
        </Text>
        {activeQuery ? (
          <Pressable
            accessibilityRole="button"
            testID="clear-search"
            onPress={() => {
              setQuery("");
              setActiveQuery("");
            }}
          >
            <Text className="text-sm font-medium text-primary-600">Clear search</Text>
          </Pressable>
        ) : null}
      </View>
      {activeQuery ? (
        <Text className="mb-2 text-xs text-surface-400">
          Results for “{activeQuery}” — ranked by relevance
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView testID="therapist-list" edges={["top"]} className="flex-1 bg-surface-50">
      <FlatList
        data={therapists}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="px-5">
            <TherapistCard
              therapist={item}
              onPress={() => router.push(`/therapist/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#6C63FF" />
            </View>
          ) : error ? (
            <View className="px-5">
              <ErrorBanner message={extractApiError(error, "Could not load therapists.")} />
              <PrimaryButton label="Retry" onPress={() => (activeQuery ? searchQuery.refetch() : listQuery.refetch())} />
            </View>
          ) : (
            <EmptyState
              title="No therapists found"
              subtitle="Try a different search or clear your filters."
            />
          )
        }
        refreshing={listQuery.isRefetching || searchQuery.isRefetching}
        onRefresh={() => (activeQuery ? searchQuery.refetch() : listQuery.refetch())}
      />
    </SafeAreaView>
  );
}