# Vendored Morpho GraphQL schema

`morpho-api.graphql` is a committed snapshot of the [Morpho GraphQL API](https://api.morpho.org/graphql)
schema. GraphQL codegen (`pnpm codegen`) reads it from disk, so builds never depend on a live upstream
or on an API credential.

The snapshot protects the *build* only. If the deployed API changes shape underneath, the app still
fails at runtime — refreshing the snapshot is a deliberate maintenance step, not an automatic one.

## Refreshing

```sh
pnpm dlx @graphql-codegen/cli \
  --config /dev/stdin <<'EOF'
schema: https://api.morpho.org/graphql
generates:
  ./schema/morpho-api.graphql:
    plugins: [schema-ast]
    config: { includeDirectives: true }
EOF
```

After refreshing, run `pnpm codegen && pnpm check:types` and review the diff for removed or newly
deprecated fields. Production queries must not use fields that report a deprecation warning: the
executor logs `extensions.warnings` from every response, so those show up in the server logs.
