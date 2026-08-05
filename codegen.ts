import type { CodegenConfig } from "@graphql-codegen/cli";

// Codegen runs against committed schema snapshots, never a live endpoint. This keeps builds
// hermetic: no API credential or network access is required at build time. Refreshing a snapshot is
// a deliberate maintenance step, see schema/README.md.
const config: CodegenConfig = {
  overwrite: true,
  ignoreNoDocuments: true,
  generates: {
    "./src/generated/gql/morpho/": {
      schema: "./schema/morpho-api.graphql",
      documents: ["src/modules/**/data/**/*.ts", "src/common/data/**/*.ts", "src/app/api/**/*.ts"],
      preset: "client",
      config: {
        // Output fields stay non-optional (a selected field is always present), but input-object
        // fields stay optional so callers can omit e.g. an unset `startTimestamp`.
        avoidOptionals: { field: true, object: true, inputValue: false, defaultValue: false },
        // String unions rather than native TS enums, so app-owned constants can be passed as
        // query variables without importing generated enums back into the app layer.
        enumsAsTypes: true,
        scalars: {
          Address: "@/morpho-types#Address", // string underlying
          // The API serializes BigInt as a JSON number when it fits safely, and as a string otherwise.
          BigInt: { input: "string", output: "@/morpho-types#BigIntish" },
          HexString: "@/morpho-types#Hex", // string underlying
          MarketId: "@/morpho-types#Hex", // string underlying
        },
      },
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
};

export default config;
