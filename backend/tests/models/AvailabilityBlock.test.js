import { describe, it, expect, beforeEach, vi } from 'vitest'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

const { createBlock, getBlocksInRange, isSlotBlocked, updateBlock, deleteBlock } = await import(
  '../../src/models/AvailabilityBlock.js'
)

describe('AvailabilityBlock Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createBlock', () => {
    it('should create a new availability block', async () => {
      const mockBlock = {
        id: 'block-1',
        salon_profile_id: 'salon-1',
        start_time: '2025-10-20T10:00:00Z',
        end_time: '2025-10-20T18:00:00Z',
        block_type: 'vacation',
        title: 'Summer Vacation',
      }

      pool.query.mockResolvedValue({
        rows: [mockBlock],
      })

      const result = await createBlock({
        salonProfileId: 'salon-1',
        startTime: '2025-10-20T10:00:00Z',
        endTime: '2025-10-20T18:00:00Z',
        blockType: 'vacation',
        title: 'Summer Vacation',
      })

      expect(result).toEqual(mockBlock)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO availability_blocks'),
        expect.arrayContaining(['salon-1', '2025-10-20T10:00:00Z'])
      )
    })
  })

  describe('getBlocksInRange', () => {
    it('should return blocks overlapping with time range', async () => {
      const mockBlocks = [
        {
          id: 'block-1',
          salon_profile_id: 'salon-1',
          start_time: '2025-10-20T10:00:00Z',
          end_time: '2025-10-20T12:00:00Z',
        },
      ]

      pool.query.mockResolvedValue({
        rows: mockBlocks,
      })

      const result = await getBlocksInRange(
        'salon-1',
        '2025-10-20T09:00:00Z',
        '2025-10-20T13:00:00Z'
      )

      expect(result).toEqual(mockBlocks)
    })

    it('should return empty array if no blocks', async () => {
      pool.query.mockResolvedValue({
        rows: [],
      })

      const result = await getBlocksInRange(
        'salon-1',
        '2025-10-20T09:00:00Z',
        '2025-10-20T10:00:00Z'
      )

      expect(result).toEqual([])
    })
  })

  describe('isSlotBlocked', () => {
    it('should return true if slot is blocked', async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 'block-1' }],
      })

      const result = await isSlotBlocked('salon-1', '2025-10-20T10:00:00Z', '2025-10-20T11:00:00Z')

      expect(result).toBe(true)
    })

    it('should return false if slot is not blocked', async () => {
      pool.query.mockResolvedValue({
        rows: [],
      })

      const result = await isSlotBlocked('salon-1', '2025-10-20T10:00:00Z', '2025-10-20T11:00:00Z')

      expect(result).toBe(false)
    })
  })

  describe('updateBlock', () => {
    it('should update allowed fields', async () => {
      const updated = {
        id: 'block-1',
        title: 'Updated Title',
        is_active: false,
      }

      pool.query.mockResolvedValue({
        rows: [updated],
      })

      const result = await updateBlock('block-1', {
        title: 'Updated Title',
        is_active: false,
      })

      expect(result).toEqual(updated)
    })

    it('should throw error if no valid fields', async () => {
      await expect(updateBlock('block-1', { invalid: 'field' })).rejects.toThrow(
        'No valid fields to update'
      )
    })
  })

  describe('deleteBlock', () => {
    it('should soft delete block', async () => {
      const deleted = {
        id: 'block-1',
        is_active: false,
      }

      pool.query.mockResolvedValue({
        rows: [deleted],
      })

      const result = await deleteBlock('block-1')

      expect(result).toEqual(deleted)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE availability_blocks'),
        ['block-1']
      )
    })
  })
})
