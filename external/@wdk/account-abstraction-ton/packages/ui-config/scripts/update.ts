import {readDeploymentsFromApi, readDvnsFromApi} from '../src/utils';
import fs from 'fs';
import path from 'path';

async function main() {
  const deployments = await readDeploymentsFromApi();
  save(
    'deploymentsV1.json',
    deployments.filter((deployment) => deployment.version === 1),
  );
  save(
    'deploymentsV2.json',
    deployments.filter((deployment) => deployment.version === 2),
  );

  const dvns = await readDvnsFromApi();
  save('dvns.json', dvns);
}

function save(fileName: string, contents: unknown) {
  const filePath = path.resolve(__dirname, '../config', fileName);
  fs.writeFileSync(filePath, JSON.stringify(contents, null, 2));
}

main();
