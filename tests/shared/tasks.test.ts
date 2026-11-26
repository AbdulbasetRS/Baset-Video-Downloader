import { TASK_STATUSES, assertTransition, canTransition, isTerminal, InvalidTransitionError } from '../../src/shared/tasks'

describe('task state machine', () => {
  it('defines all nine required states', () => {
    expect([...TASK_STATUSES]).toEqual(['Resolving', 'FetchingMetadata', 'Waiting', 'Downloading', 'Paused', 'PostProcessing', 'Completed', 'Failed', 'Canceled'])
  })

  it('allows the normal happy path', () => {
    const path = ['Resolving', 'FetchingMetadata', 'Waiting', 'Downloading', 'PostProcessing', 'Completed'] as const
    for (let i = 0; i < path.length - 1; i++) expect(canTransition(path[i], path[i + 1])).toBe(true)
  })

  it('allows pause and resume while downloading', () => {
    expect(canTransition('Downloading', 'Paused')).toBe(true)
    expect(canTransition('Paused', 'Downloading')).toBe(true)
  })

  it('never lets a task jump straight from Waiting to Completed', () => {
    expect(canTransition('Waiting', 'Completed')).toBe(false)
    expect(() => assertTransition('Waiting', 'Completed')).toThrow(InvalidTransitionError)
  })

  it('treats Completed as final', () => {
    for (const s of TASK_STATUSES) expect(canTransition('Completed', s)).toBe(false)
  })

  it('lets failed or canceled tasks be retried, but not resumed mid-transfer', () => {
    expect(canTransition('Failed', 'Resolving')).toBe(true)
    expect(canTransition('Canceled', 'Resolving')).toBe(true)
    expect(canTransition('Failed', 'Downloading')).toBe(false)
  })

  it('marks terminal states', () => {
    expect(isTerminal('Completed')).toBe(true)
    expect(isTerminal('Failed')).toBe(true)
    expect(isTerminal('Downloading')).toBe(false)
  })
})
