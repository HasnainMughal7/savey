import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    subscriptions: defineTable({
        userId: v.string(),

        name: v.string(),
        price: v.number(),
        currency: v.string(),

        frequency: v.union(
            v.literal('Monthly'),
            v.literal('Yearly'),
        ),

        category: v.string(),

        status: v.union(
            v.literal('active'),
            v.literal('cancelled'),
        ),

        startDate: v.string(),
        renewalDate: v.string(),

        billing: v.string(),

        color: v.optional(v.string()),
        iconUrl: v.optional(v.string()),

        plan: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
    }).index('by_user', ['userId']),
});