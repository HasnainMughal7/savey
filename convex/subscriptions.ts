import { v } from 'convex/values';
import {
    mutation,
    query,
} from './_generated/server';

export const getMine = query({
    args: {},

    handler: async (ctx) => {
        const identity =
            await ctx.auth.getUserIdentity();

        if (!identity) {
            return [];
        }

        return await ctx.db
            .query('subscriptions')
            .withIndex('by_user', (q) =>
                q.eq('userId', identity.subject),
            )
            .order('desc')
            .collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        price: v.number(),
        currency: v.string(),

        frequency: v.union(
            v.literal('Monthly'),
            v.literal('Yearly'),
        ),

        category: v.string(),

        startDate: v.string(),
        renewalDate: v.string(),

        billing: v.string(),

        color: v.optional(v.string()),
        iconUrl: v.optional(v.string()),

        plan: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
    },

    handler: async (ctx, args) => {
        const identity =
            await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error(
                'You must be signed in to create a subscription.',
            );
        }

        return await ctx.db.insert(
            'subscriptions',
            {
                userId: identity.subject,

                ...args,

                status: 'active',
            },
        );
    },
});

export const cancel = mutation({
    args: {
        id: v.id('subscriptions'),
    },

    handler: async (ctx, args) => {
        const identity =
            await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error(
                'You must be signed in.',
            );
        }

        const subscription =
            await ctx.db.get(args.id);

        if (!subscription) {
            throw new Error(
                'Subscription not found.',
            );
        }

        if (
            subscription.userId !==
            identity.subject
        ) {
            throw new Error('Unauthorized.');
        }

        await ctx.db.patch(args.id, {
            status: 'cancelled',
        });
    },
});

export const remove = mutation({
    args: {
        id: v.id('subscriptions'),
    },

    handler: async (ctx, args) => {
        const identity =
            await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error(
                'You must be signed in.',
            );
        }

        const subscription =
            await ctx.db.get(args.id);

        if (!subscription) return;

        if (
            subscription.userId !==
            identity.subject
        ) {
            throw new Error('Unauthorized.');
        }

        await ctx.db.delete(args.id);
    },
});