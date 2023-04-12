# Jellyfish React Client Demo - Dashboard

Run

```shell
yarn run dev
# or
npm run dev
```


# Generate Server SDK client
```shell
npx @openapitools/openapi-generator-cli generate -i http://localhost:4000/openapi.json   -g typescript-axios -o ./src/server-sdk --skip-validate-spec
```