const GRAPHQL_ID_PREFIX = /^(?:bas|ap|net|ip|cli|cpe|sm|ia)([0-9a-f-]{36})$/i;

export function toBackendId(id: string): string {
  return GRAPHQL_ID_PREFIX.exec(id)?.[1] ?? id;
}
