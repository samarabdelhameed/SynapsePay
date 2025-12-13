/**
 * Property-Based Tests for Memory System
 * **Feature: synapsepay-enhancements, Property 11: تذكر السياق**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import fc from 'fast-check';
import { 
    AdvancedAIOrchestrator,
    MemoryEntry
} from '../src';

describe('Memory System Properties', () => {
    let orchestrator: AdvancedAIOrchestrator;

    beforeEach(() => {
        orchestrator = new AdvancedAIOrchestrator({
            maxMemoryEntries: 100,
            memoryRetentionDays: 30,
            maxConversationHistory: 50,
            enabledFeatures: {
                multiModal: true,
                chainOfThought: true,
                memorySystem: true,
                externalAPIs: true,
                customAgents: true
            }
        });
    });

    /**
     * **Feature: synapsepay-enhancements, Property 11: تذكر السياق**
     * Property: For any conversation, the system should remember previous information and use it in subsequent responses
     */
    it('Property 1: Should store and retrieve conversation memory correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    sessionId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `test_${Date.now()}_${Math.random()}_${s}`),
                    memories: fc.array(
                        fc.record({
                            sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                            content: fc.string({ minLength: 10, maxLength: 200 }),
                            type: fc.oneof(
                                fc.constant('fact'),
                                fc.constant('preference'),
                                fc.constant('context'),
                                fc.constant('skill')
                            ),
                            importance: fc.integer({ min: 1, max: 10 }),
                            expiresAt: fc.option(fc.integer({ min: Date.now() + 60000, max: Date.now() + 86400000 }))
                        }),
                        { minLength: 1, maxLength: 10 }
                    )
                }),
                async ({ sessionId, memories }) => {
                    const storedIds: string[] = [];
                    
                    // Store all memories
                    for (const memory of memories) {
                        const memoryId = await orchestrator.storeMemory(sessionId, memory);
                        storedIds.push(memoryId);
                        
                        // Property: Memory ID should be generated
                        expect(memoryId).toBeDefined();
                        expect(memoryId).toMatch(/^mem_\d+_[a-z0-9]+$/);
                    }
                    
                    // Retrieve all memories for the session
                    const retrievedMemories = await orchestrator.retrieveMemory(sessionId);
                    
                    // Property: All stored memories should be retrievable
                    expect(retrievedMemories).toHaveLength(memories.length);
                    
                    // Property: Retrieved memories should match stored ones
                    for (let i = 0; i < memories.length; i++) {
                        const original = memories[i];
                        const retrieved = retrievedMemories[i];
                        
                        expect(retrieved.id).toBe(storedIds[i]);
                        expect(retrieved.sessionId).toBe(sessionId);
                        expect(retrieved.content).toBe(original.content);
                        expect(retrieved.type).toBe(original.type);
                        expect(retrieved.importance).toBe(original.importance);
                        expect(retrieved.timestamp).toBeGreaterThan(0);
                        
                        if (original.expiresAt) {
                            expect(retrieved.expiresAt).toBe(original.expiresAt);
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should handle memory queries correctly
     */
    it('Property 2: Should filter memories based on query parameters', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                    memories: fc.array(
                        fc.record({
                            sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                            content: fc.oneof(
                                fc.constant('user likes coffee'),
                                fc.constant('user prefers tea'),
                                fc.constant('user works in technology'),
                                fc.constant('user enjoys reading books'),
                                fc.constant('user speaks multiple languages')
                            ),
                            type: fc.oneof(
                                fc.constant('fact'),
                                fc.constant('preference'),
                                fc.constant('context'),
                                fc.constant('skill')
                            ),
                            importance: fc.integer({ min: 1, max: 10 })
                        }),
                        { minLength: 3, maxLength: 8 }
                    ),
                    query: fc.oneof(
                        fc.constant('coffee'),
                        fc.constant('technology'),
                        fc.constant('preference'),
                        fc.constant('fact')
                    )
                }),
                async ({ sessionId, memories, query }) => {
                    // Use a unique session ID for this test
                    const uniqueSessionId = `query_test_${Date.now()}_${Math.random()}_${sessionId}`;
                    
                    // Store all memories
                    for (const memory of memories) {
                        await orchestrator.storeMemory(uniqueSessionId, memory);
                    }
                    
                    // Query memories
                    const filteredMemories = await orchestrator.retrieveMemory(uniqueSessionId, query);
                    
                    // Property: Filtered memories should match query criteria
                    for (const memory of filteredMemories) {
                        const matchesContent = memory.content.toLowerCase().includes(query.toLowerCase());
                        const matchesType = memory.type === query;
                        expect(matchesContent || matchesType).toBe(true);
                    }
                    
                    // Property: All matching memories should be included
                    const expectedMatches = memories.filter(m => 
                        m.content.toLowerCase().includes(query.toLowerCase()) || m.type === query
                    );
                    expect(filteredMemories.length).toBe(expectedMatches.length);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should respect memory limits per session
     */
    it('Property 3: Should respect maximum memory entries per session', async () => {
        const limitedOrchestrator = new AdvancedAIOrchestrator({
            maxMemoryEntries: 5, // Small limit for testing
            memoryRetentionDays: 30,
            maxConversationHistory: 50,
            enabledFeatures: {
                multiModal: true,
                chainOfThought: true,
                memorySystem: true,
                externalAPIs: true,
                customAgents: true
            }
        });

        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                    memoryCount: fc.integer({ min: 6, max: 15 }) // More than the limit
                }),
                async ({ sessionId, memoryCount }) => {
                    // Store more memories than the limit
                    for (let i = 0; i < memoryCount; i++) {
                        await limitedOrchestrator.storeMemory(sessionId, {
                            sessionId,
                            content: `Memory content ${i}`,
                            type: 'fact',
                            importance: i + 1
                        });
                    }
                    
                    // Retrieve memories
                    const retrievedMemories = await limitedOrchestrator.retrieveMemory(sessionId);
                    
                    // Property: Should not exceed maximum memory entries
                    expect(retrievedMemories.length).toBeLessThanOrEqual(5);
                    
                    // Property: Should keep the most recent memories
                    if (retrievedMemories.length === 5) {
                        // Check that we have the last 5 memories
                        for (let i = 0; i < 5; i++) {
                            const expectedContent = `Memory content ${memoryCount - 5 + i}`;
                            expect(retrievedMemories[i].content).toBe(expectedContent);
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle expired memories correctly
     */
    it('Property 4: Should filter out expired memories', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    sessionId: fc.string({ minLength: 10, maxLength: 30 }).map(s => `expired_test_${Date.now()}_${Math.random()}_${s}`),
                    validMemories: fc.array(
                        fc.record({
                            sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                            content: fc.string({ minLength: 10, maxLength: 100 }),
                            type: fc.oneof(fc.constant('fact'), fc.constant('preference')),
                            importance: fc.integer({ min: 1, max: 10 }),
                            expiresAt: fc.integer({ min: Date.now() + 60000, max: Date.now() + 86400000 }) // Future
                        }),
                        { minLength: 1, maxLength: 5 }
                    ),
                    expiredMemories: fc.array(
                        fc.record({
                            sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                            content: fc.string({ minLength: 10, maxLength: 100 }),
                            type: fc.oneof(fc.constant('context'), fc.constant('skill')),
                            importance: fc.integer({ min: 1, max: 10 }),
                            expiresAt: fc.integer({ min: Date.now() - 86400000, max: Date.now() - 1000 }) // Past
                        }),
                        { minLength: 1, maxLength: 3 }
                    )
                }),
                async ({ sessionId, validMemories, expiredMemories }) => {
                    // Store valid memories
                    for (const memory of validMemories) {
                        await orchestrator.storeMemory(sessionId, memory);
                    }
                    
                    // Store expired memories
                    for (const memory of expiredMemories) {
                        await orchestrator.storeMemory(sessionId, memory);
                    }
                    
                    // Retrieve memories
                    const retrievedMemories = await orchestrator.retrieveMemory(sessionId);
                    
                    // Property: Should only return non-expired memories
                    expect(retrievedMemories.length).toBe(validMemories.length);
                    
                    // Property: All retrieved memories should be valid (not expired)
                    const now = Date.now();
                    for (const memory of retrievedMemories) {
                        if (memory.expiresAt) {
                            expect(memory.expiresAt).toBeGreaterThan(now);
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should handle concurrent memory operations
     */
    it('Property 5: Should handle concurrent memory storage and retrieval', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                    concurrentOperations: fc.integer({ min: 3, max: 8 }),
                    memoriesPerOperation: fc.integer({ min: 2, max: 5 })
                }),
                async ({ sessionId, concurrentOperations, memoriesPerOperation }) => {
                    // Use a unique session ID for this test
                    const uniqueSessionId = `concurrent_test_${Date.now()}_${Math.random()}_${sessionId}`;
                    
                    // Create concurrent storage operations
                    const storePromises = Array.from({ length: concurrentOperations }, (_, opIndex) =>
                        Promise.all(
                            Array.from({ length: memoriesPerOperation }, (_, memIndex) =>
                                orchestrator.storeMemory(uniqueSessionId, {
                                    sessionId: uniqueSessionId,
                                    content: `Concurrent memory ${opIndex}-${memIndex}`,
                                    type: 'fact',
                                    importance: memIndex + 1
                                })
                            )
                        )
                    );
                    
                    // Wait for all storage operations to complete
                    const allStoredIds = await Promise.all(storePromises);
                    const flatStoredIds = allStoredIds.flat();
                    
                    // Retrieve memories
                    const retrievedMemories = await orchestrator.retrieveMemory(uniqueSessionId);
                    
                    // Property: All stored memories should be retrievable
                    expect(retrievedMemories.length).toBe(concurrentOperations * memoriesPerOperation);
                    
                    // Property: All memory IDs should be unique
                    const retrievedIds = retrievedMemories.map(m => m.id);
                    const uniqueIds = new Set(retrievedIds);
                    expect(uniqueIds.size).toBe(retrievedIds.length);
                    
                    // Property: All stored IDs should be present in retrieved memories
                    for (const storedId of flatStoredIds) {
                        expect(retrievedIds).toContain(storedId);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle disabled memory system
     */
    it('Property 6: Should reject operations when memory system is disabled', async () => {
        const disabledOrchestrator = new AdvancedAIOrchestrator({
            maxMemoryEntries: 100,
            memoryRetentionDays: 30,
            maxConversationHistory: 50,
            enabledFeatures: {
                multiModal: true,
                chainOfThought: true,
                memorySystem: false,
                externalAPIs: true,
                customAgents: true
            }
        });

        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                    memory: fc.record({
                        sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                        content: fc.string({ minLength: 10, maxLength: 100 }),
                        type: fc.oneof(fc.constant('fact'), fc.constant('preference')),
                        importance: fc.integer({ min: 1, max: 10 })
                    })
                }),
                async ({ sessionId, memory }) => {
                    // Test storage rejection
                    await expect(disabledOrchestrator.storeMemory(sessionId, memory))
                        .rejects.toThrow('Memory system is not enabled');
                    
                    // Test retrieval rejection
                    await expect(disabledOrchestrator.retrieveMemory(sessionId))
                        .rejects.toThrow('Memory system is not enabled');
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should generate unique memory IDs
     */
    it('Property 7: Should generate unique memory IDs across sessions', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                        content: fc.string({ minLength: 10, maxLength: 100 }),
                        type: fc.oneof(fc.constant('fact'), fc.constant('preference'), fc.constant('context')),
                        importance: fc.integer({ min: 1, max: 10 })
                    }),
                    { minLength: 5, maxLength: 20 }
                ),
                async (memories) => {
                    const allMemoryIds: string[] = [];
                    
                    // Store all memories
                    for (const memory of memories) {
                        const memoryId = await orchestrator.storeMemory(memory.sessionId, memory);
                        allMemoryIds.push(memoryId);
                    }
                    
                    // Property: All memory IDs should be unique
                    const uniqueIds = new Set(allMemoryIds);
                    expect(uniqueIds.size).toBe(allMemoryIds.length);
                    
                    // Property: Memory IDs should follow expected format
                    for (const memoryId of allMemoryIds) {
                        expect(memoryId).toMatch(/^mem_\d+_[a-z0-9]+$/);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should handle different memory types correctly
     */
    it('Property 8: Should handle all memory types correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    sessionId: fc.string({ minLength: 5, maxLength: 20 }),
                    memoryTypes: fc.shuffledSubarray(['fact', 'preference', 'context', 'skill'], { minLength: 1, maxLength: 4 })
                }),
                async ({ sessionId, memoryTypes }) => {
                    // Use a unique session ID for this test
                    const uniqueSessionId = `types_test_${Date.now()}_${Math.random()}_${sessionId}`;
                    
                    // Store memories of different types
                    for (const type of memoryTypes) {
                        const memoryId = await orchestrator.storeMemory(uniqueSessionId, {
                            sessionId: uniqueSessionId,
                            content: `This is a ${type} memory`,
                            type: type as 'fact' | 'preference' | 'context' | 'skill',
                            importance: Math.floor(Math.random() * 10) + 1
                        });
                        
                        expect(memoryId).toBeDefined();
                    }
                    
                    // Retrieve memories
                    const retrievedMemories = await orchestrator.retrieveMemory(uniqueSessionId);
                    
                    // Property: Should retrieve all stored memory types
                    expect(retrievedMemories.length).toBe(memoryTypes.length);
                    
                    // Property: Each memory type should be preserved
                    const retrievedTypes = retrievedMemories.map(m => m.type);
                    for (const type of memoryTypes) {
                        expect(retrievedTypes).toContain(type);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});