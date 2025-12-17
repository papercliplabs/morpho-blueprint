import type { CodegenConfig } from "@graphql-codegen/cli";
import "dotenv/config";

const config: CodegenConfig = {
  overwrite: true,
  ignoreNoDocuments: true,
  documents: ["src/modules/**/data/**/*.ts", "src/common/data/**/*.ts", "src/app/api/**/*.ts"],
  schema: { [process.env.WHISK_API_URL!]: { headers: { Authorization: `Bearer ${process.env.WHISK_API_KEY!}` } } },
  generates: {
    "./src/generated/gql/whisk/": {
      preset: "client",
      config: {
        avoidOptionals: true,
        scalars: {
          Address: "@/whisk-types#Address", // string underlying
          ChainId: "@/whisk-types#ChainId", // number underlying
          BigInt: { input: "string", output: "@/whisk-types#BigIntish" }, // string underlying
          Hex: "@/whisk-types#Hex", // string underlying
          URL: "string",
        },
      },
      presetConfig: {
        fragmentMasking: false,
      },
    },
    "./src/generated/gql/schema.graphql": {
      plugins: ["schema-ast"],
      config: {
        includeDirectives: true,
      },
    },
  },
};

export default config;
