import { icons } from '@/constants/icons';
import { colors } from '@/constants/theme';
import { getBrandLogo } from '@/lib/brandLogo';
import { posthog } from '@/lib/posthog';
import { Ionicons } from '@expo/vector-icons';
import { clsx } from 'clsx';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

const FREQUENCIES = [
    'Monthly',
    'Yearly',
] as const;

const CATEGORIES = [
    'Entertainment',
    'AI Tools',
    'Developer Tools',
    'Design',
    'Productivity',
    'Cloud',
    'Music',
    'Other',
] as const;

type Frequency = (typeof FREQUENCIES)[number];
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
    Entertainment: '#ffd6a5',
    'AI Tools': '#b8d4e3',
    'Developer Tools': '#e8def8',
    Design: '#f5c542',
    Productivity: '#b8e8d0',
    Cloud: '#cfe8ff',
    Music: '#d8c7ff',
    Other: '#f6eecf',
};

interface CreateSubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (subscription: Subscription) => void;
}

const CreateSubscriptionModal = ({
    visible,
    onClose,
    onCreate,
}: CreateSubscriptionModalProps) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [frequency, setFrequency] =
        useState<Frequency>('Monthly');

    const [category, setCategory] =
        useState<Category>('Entertainment');

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const numericPrice = useMemo(() => {
        return Number(
            price.trim().replace(',', '.'),
        );
    }, [price]);

    const isFormValid =
        name.trim().length > 0 &&
        Number.isFinite(numericPrice) &&
        numericPrice > 0;

    const resetForm = () => {
        setName('');
        setPrice('');
        setFrequency('Monthly');
        setCategory('Entertainment');
        setError('');
        setIsSubmitting(false);
    };

    const handleClose = () => {
        if (isSubmitting) return;

        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError(
                'Please enter a subscription name.',
            );
            return;
        }

        if (
            !Number.isFinite(numericPrice) ||
            numericPrice <= 0
        ) {
            setError(
                'Please enter a valid positive price.',
            );
            return;
        }

        setError('');
        setIsSubmitting(true);

        const startDate = dayjs();

        const renewalDate =
            frequency === 'Monthly'
                ? startDate.add(1, 'month')
                : startDate.add(1, 'year');

        let icon: Subscription['icon'] =
            icons.wallet;

        try {
            icon =
                await getBrandLogo(trimmedName);
        } catch {
            icon = icons.wallet;
        }

        const subscription: Subscription = {
            id: `subscription-${Date.now()}`,
            name: trimmedName,
            price: numericPrice,
            currency: 'USD',
            frequency,
            billing: frequency,
            category,
            status: 'active',
            startDate: startDate.toISOString(),
            renewalDate:
                renewalDate.toISOString(),
            icon,
            color: CATEGORY_COLORS[category],
        };

        onCreate(subscription);

        posthog?.capture(
            'subscription_created',
            {
                subscription_id:
                    subscription.id,
                subscription_name:
                    subscription.name,
                subscription_price:
                    subscription.price,
                subscription_frequency:
                    frequency,
                subscription_category:
                    category,
                source:
                    'create_subscription_modal',
                brand_logo_found:
                    typeof icon === 'string',
            },
        );

        resetForm();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
                className="flex-1"
            >
                <Pressable
                    className="modal-overlay"
                    onPress={handleClose}
                >
                    <Pressable
                        className="modal-container"
                        onPress={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <View className="modal-header">
                            <Text className="modal-title">
                                New Subscription
                            </Text>

                            <Pressable
                                className="modal-close"
                                onPress={handleClose}
                                hitSlop={10}
                                accessibilityRole="button"
                                accessibilityLabel="Close modal"
                            >
                                <Ionicons
                                    name="close"
                                    size={20}
                                    color={
                                        colors.primary
                                    }
                                />
                            </Pressable>
                        </View>

                        <ScrollView
                            className="w-full"
                            contentContainerClassName="modal-body"
                            keyboardDismissMode="on-drag"
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={
                                false
                            }
                        >
                            <View className="gap-2">
                                <Text className="auth-label">
                                    Name
                                </Text>

                                <TextInput
                                    value={name}
                                    onChangeText={
                                        setName
                                    }
                                    placeholder="e.g. Netflix"
                                    placeholderTextColor={
                                        colors.mutedForeground
                                    }
                                    selectionColor={
                                        colors.accent
                                    }
                                    autoCapitalize="words"
                                    className="auth-input"
                                />
                            </View>

                            <View className="gap-2">
                                <Text className="auth-label">
                                    Price
                                </Text>

                                <TextInput
                                    value={price}
                                    onChangeText={
                                        setPrice
                                    }
                                    placeholder="e.g. 15.99"
                                    placeholderTextColor={
                                        colors.mutedForeground
                                    }
                                    selectionColor={
                                        colors.accent
                                    }
                                    keyboardType="decimal-pad"
                                    className="auth-input"
                                />
                            </View>

                            <View className="gap-2">
                                <Text className="auth-label">
                                    Frequency
                                </Text>

                                <View className="picker-row">
                                    {FREQUENCIES.map(
                                        (option) => {
                                            const isActive =
                                                frequency ===
                                                option;

                                            return (
                                                <Pressable
                                                    key={
                                                        option
                                                    }
                                                    onPress={() =>
                                                        setFrequency(
                                                            option,
                                                        )
                                                    }
                                                    className={clsx(
                                                        'picker-option',
                                                        isActive &&
                                                        'picker-option-active',
                                                    )}
                                                >
                                                    <Text
                                                        className={clsx(
                                                            'picker-option-text',
                                                            isActive &&
                                                            'picker-option-text-active',
                                                        )}
                                                    >
                                                        {
                                                            option
                                                        }
                                                    </Text>
                                                </Pressable>
                                            );
                                        },
                                    )}
                                </View>
                            </View>

                            <View className="gap-2">
                                <Text className="auth-label">
                                    Category
                                </Text>

                                <View className="category-scroll">
                                    {CATEGORIES.map(
                                        (option) => {
                                            const isActive =
                                                category ===
                                                option;

                                            return (
                                                <Pressable
                                                    key={
                                                        option
                                                    }
                                                    onPress={() =>
                                                        setCategory(
                                                            option,
                                                        )
                                                    }
                                                    className={clsx(
                                                        'category-chip',
                                                        isActive &&
                                                        'category-chip-active',
                                                    )}
                                                >
                                                    <Text
                                                        className={clsx(
                                                            'category-chip-text',
                                                            isActive &&
                                                            'category-chip-text-active',
                                                        )}
                                                    >
                                                        {
                                                            option
                                                        }
                                                    </Text>
                                                </Pressable>
                                            );
                                        },
                                    )}
                                </View>
                            </View>

                            {error ? (
                                <Text className="auth-error">
                                    {error}
                                </Text>
                            ) : null}

                            <Pressable
                                disabled={
                                    !isFormValid ||
                                    isSubmitting
                                }
                                onPress={handleSubmit}
                                className={clsx(
                                    'auth-button',
                                    (!isFormValid ||
                                        isSubmitting) &&
                                    'auth-button-disabled',
                                )}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator
                                        color={
                                            colors.primary
                                        }
                                    />
                                ) : (
                                    <Text className="auth-button-text">
                                        Create
                                        Subscription
                                    </Text>
                                )}
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CreateSubscriptionModal;