import 'dotenv/config';

// Base de données dédiée aux tests : jamais celle de développement (les tests la vident entièrement)
// Par défaut : même serveur, nom de base suffixé par « _test » (ex. orbea → orbea_test)
export function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `${url.pathname.replace(/^\//, '')}_test`;
  return url.toString();
}
