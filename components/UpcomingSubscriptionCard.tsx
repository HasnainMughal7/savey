import { formatCurrency } from '@/lib/utils';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

const UpcomingSubscriptionCard = ({ name, price, daysLeft, icon, currency }: UpcomingSubscription) => {
    return (
        <View className="upcoming-card">
            <View className="upcoming-row">

                <Image
                    source={
                        typeof icon === 'string'
                            ? { uri: icon }
                            : icon
                    }
                    style={{
                        width: 56,
                        height: 56,
                    }}
                    contentFit="contain"
                />
                <View>
                    <Text className="upcoming-price">{formatCurrency(price, currency)}</Text>
                    <Text className="upcoming-meta" numberOfLines={1} >
                        {daysLeft > 1 ? `${daysLeft} days left` : `Last day`}
                    </Text>
                </View>

            </View>
            <Text className="upcoming-name" numberOfLines={1} >{name}</Text>

        </View>
    )
}

export default UpcomingSubscriptionCard