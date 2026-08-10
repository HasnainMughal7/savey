import SubscriptionCard from '@/components/SubscriptionCard';
import { colors } from '@/constants/theme';
import { posthog } from '@/lib/posthog';
import { useSubscriptionsStore } from '@/store/subscriptionsStore';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import { useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {

    const subscriptions = useSubscriptionsStore(
        (state) => state.subscriptions,
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSubscriptionId, setExpandedSubscriptionId] =
        useState<string | null>(null);

    const filteredSubscriptions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return subscriptions;
        }

        return subscriptions.filter((subscription) =>
            [
                subscription.name,
                subscription.plan,
                subscription.category,
                subscription.billing,
                subscription.status,
            ].some((value) =>
                value?.toLowerCase().includes(query),
            ),
        );
    }, [searchQuery, subscriptions]);

    return (
        <SafeAreaView className="flex-1 bg-background">
            <FlatList
                data={filteredSubscriptions}
                keyExtractor={(item) => item.id}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="px-5 pb-30"
                extraData={expandedSubscriptionId}
                ListHeaderComponent={
                    <View className="mb-5 pt-2">
                        <Text className="text-4xl font-sans-extrabold text-primary">
                            Subscriptions
                        </Text>

                        <Text className="mt-2 text-base font-sans-medium text-muted-foreground">
                            Search and manage all your recurring payments.
                        </Text>

                        <View className="mt-5 flex-row items-center rounded-2xl border border-border bg-card px-4">
                            <Ionicons
                                name="search-outline"
                                size={22}
                                color={colors.mutedForeground}
                            />

                            <TextInput
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search subscriptions"
                                placeholderTextColor={colors.mutedForeground}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="search"
                                className="ml-3 flex-1 py-4 text-base font-sans-medium text-primary"
                            />

                            {searchQuery.length > 0 && (
                                <Pressable
                                    onPress={() => setSearchQuery('')}
                                    hitSlop={10}
                                    accessibilityRole="button"
                                    accessibilityLabel="Clear subscription search"
                                    className="size-8 items-center justify-center rounded-full bg-muted"
                                >
                                    <Ionicons
                                        name="close"
                                        size={18}
                                        color={colors.primary}
                                    />
                                </Pressable>
                            )}
                        </View>

                        <Text className="mt-3 text-sm font-sans-semibold text-muted-foreground">
                            {filteredSubscriptions.length}{' '}
                            {filteredSubscriptions.length === 1
                                ? 'subscription'
                                : 'subscriptions'}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedSubscriptionId === item.id}
                        onPress={() => {
                            const isExpanding = expandedSubscriptionId !== item.id;

                            posthog?.capture(
                                isExpanding
                                    ? 'subscription_expanded'
                                    : 'subscription_collapsed',
                                {
                                    subscription_id: item.id,
                                    subscription_name: item.name,
                                    ...(item.category
                                        ? { subscription_category: item.category }
                                        : {}),
                                    source: 'subscriptions_screen',
                                },
                            );

                            setExpandedSubscriptionId(
                                isExpanding ? item.id : null,
                            );
                        }}
                    />
                )}
                ItemSeparatorComponent={() => <View className="h-4" />}
                ListEmptyComponent={
                    <View className="items-center rounded-2xl border border-border bg-card px-6 py-10">
                        <View className="size-14 items-center justify-center rounded-full bg-muted">
                            <Ionicons
                                name="search-outline"
                                size={26}
                                color={colors.primary}
                            />
                        </View>

                        <Text className="mt-4 text-lg font-sans-bold text-primary">
                            No subscriptions found
                        </Text>

                        <Text className="mt-2 text-center text-sm font-sans-medium leading-5 text-muted-foreground">
                            Try searching by name, plan, category, billing cycle, or
                            status.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

export default Subscriptions;