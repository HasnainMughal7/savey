import { icons } from '@/constants/icons';
import type { ImageSourcePropType } from 'react-native';

interface IconifySearchResponse {
    icons?: string[];
}

export async function getBrandLogo(
    brandName: string,
): Promise<ImageSourcePropType | string> {
    try {
        const response = await fetch(
            `https://api.iconify.design/search?query=${encodeURIComponent(
                brandName.trim(),
            )}&prefix=simple-icons&limit=32`,
        );

        if (!response.ok) {
            return icons.wallet;
        }

        const data =
            (await response.json()) as IconifySearchResponse;

        const firstIcon = data.icons?.[0];

        if (!firstIcon) {
            return icons.wallet;
        }

        const [, slug] = firstIcon.split(':');

        if (!slug) {
            return icons.wallet;
        }

        return `https://cdn.simpleicons.org/${encodeURIComponent(slug)}`;
    } catch {
        return icons.wallet;
    }
}