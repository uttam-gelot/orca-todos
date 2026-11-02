import type { Todo } from '../../src/model'

/** A valid todo in the default `todo` state. Override only the fields a test cares about. */
export function makeTodo(over: Partial<Todo> = {}): Todo {
  return {
    id: 'a',
    title: 'Fix login',
    description: 'See https://example.com',
    stateId: 'todo',
    tags: [],
    priority: 'none',
    archived: false,
    order: 1,
    createdAt: 0,
    updatedAt: 0,
    ...over
  }
}
