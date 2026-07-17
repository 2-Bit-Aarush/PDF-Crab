const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('scratch/openapi_spec.json', 'utf8'));

console.log('--- Vaults Properties ---');
if (spec.definitions && spec.definitions.vaults) {
  console.log(JSON.stringify(spec.definitions.vaults, null, 2));
} else {
  console.log('vaults definition not found in OpenAPI spec.');
}

console.log('\n--- Vault Members Properties ---');
if (spec.definitions && spec.definitions.vault_members) {
  console.log(JSON.stringify(spec.definitions.vault_members, null, 2));
} else {
  console.log('vault_members definition not found.');
}
