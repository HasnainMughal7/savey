import CreateSubscriptionModal from '@/components/CreateSubscriptionModal';
import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import {
  HOME_BALANCE,
  HOME_USER,
} from '@/constants/data';
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import { api } from '@/convex/_generated/api';
import "@/global.css";
import { posthog } from "@/lib/posthog";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import { useQuery } from 'convex/react';
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {

  const convexSubscriptions =
    useQuery(api.subscriptions.getMine);

  const [
    expandedSubscriptionId,
    setExpandedSubscriptionId,
  ] = useState<string | null>(null);

  const [isCreateModalVisible, setIsCreateModalVisible] =
    useState(false);

  const subscriptions =
    convexSubscriptions ?? [];

  const { user } = useUser();
  const displayName = user?.firstName || user?.username || HOME_USER.name;
  const avatarSource = user?.hasImage ? { uri: user.imageUrl } : images.avatar;

  const upcomingSubscriptions = useMemo(() => {
    const today = dayjs().startOf('day');

    return subscriptions
      .filter((subscription) => {
        if (subscription.status !== 'active') {
          return false;
        }

        if (!subscription.renewalDate) {
          return false;
        }

        return dayjs(subscription.renewalDate).isAfter(
          today.subtract(1, 'day'),
        );
      })
      .sort(
        (a, b) =>
          dayjs(a.renewalDate).valueOf() -
          dayjs(b.renewalDate).valueOf(),
      )
      .slice(0, 5)
      .map((subscription) => ({
        id: subscription._id,
        name: subscription.name,
        price: subscription.price,
        currency: subscription.currency,
        icon: subscription.iconUrl
          ? subscription.iconUrl
          : icons.wallet,

        daysLeft: Math.max(
          0,
          dayjs(subscription.renewalDate)
            .startOf('day')
            .diff(today, 'day'),
        ),
      }));
  }, [subscriptions]);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">

      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image source={avatarSource} className="home-avatar" />
                <Text className="home-user-name">{displayName}</Text>
              </View>

              <Pressable
                onPress={() => setIsCreateModalVisible(true)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Add subscription"
              >
                <Image
                  source={icons.add}
                  className="home-add-icon"
                />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>

              <View className="home-balance-row">
                <Text className="home-balance-amount">{formatCurrency(HOME_BALANCE.amount)}</Text>
                <Text className="home-balance-date">
                  {dayjs(HOME_BALANCE.nextRenewalDate).format('DD/MM')}
                </Text>
              </View>

            </View>

            <View className="mb-5">
              <ListHeading title="Upcoming" />
              <FlatList
                data={upcomingSubscriptions}
                renderItem={({ item }) => (
                  <UpcomingSubscriptionCard {...item} />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">
                    No upcoming renewals yet.
                  </Text>
                }
              />

            </View>

            <ListHeading title="All Subscriptions" />

          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <SubscriptionCard
            name={item.name}
            price={item.price}
            currency={item.currency}
            category={item.category}
            billing={item.billing}
            status={item.status}
            startDate={item.startDate}
            renewalDate={item.renewalDate}
            color={item.color}
            plan={item.plan}
            paymentMethod={
              item.paymentMethod
            }
            icon={
              item.iconUrl
                ? item.iconUrl
                : icons.wallet
            }
            expanded={
              expandedSubscriptionId ===
              item._id
            }
            onPress={() => {
              const isExpanding =
                expandedSubscriptionId !==
                item._id;

              posthog?.capture(
                isExpanding
                  ? 'subscription_expanded'
                  : 'subscription_collapsed',
                {
                  subscription_id:
                    item._id,

                  subscription_name:
                    item.name,

                  subscription_category:
                    item.category,
                },
              );

              setExpandedSubscriptionId(
                isExpanding
                  ? item._id
                  : null,
              );
            }}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text className="home-empty-state">No subscriptions yet.</Text>}
        contentContainerClassName="pb-30"
      />

      <CreateSubscriptionModal
        visible={isCreateModalVisible}
        onClose={() =>
          setIsCreateModalVisible(false)
        }
      />

    </SafeAreaView>
  );
}
