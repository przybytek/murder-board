## Overview
This is a comprehensive project template for building and deploying modern web applications using TypeScript, React, AWS CDK, serverless Lambda functions, DynamoDB for data persistence, and a full test suite with coverage enforcement. The stack deploys a React SPA to CloudFront/S3 and a REST API via API Gateway, both served under a custom domain with automatically provisioned TLS certificates.

---

## Project Structure

```
project-root/
├── apps/
│   ├── frontend/              # React + Vite application
│   │   ├── index.html
│   │   ├── vite.config.ts     # Vite + Vitest + coverage config
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── App.css
│   │       ├── api.ts          # fetch/save helpers (API or localStorage fallback)
│   │       ├── components/     # React components
│   │       ├── hooks/          # Custom hooks (state, API integration)
│   │       └── test/           # Vitest tests + setup
│   └── backend/               # AWS CDK app
│       ├── cdk.json
│       ├── tsconfig.json
│       ├── package.json
│       ├── bin/
│       │   └── app.ts          # CDK entry point
│       ├── lib/
│       │   └── stack.ts        # Full CDK stack definition
│       └── lambda/
│           └── handler.ts      # Lambda function handler
├── packages/
│   └── shared/
│       └── src/index.ts        # Shared TypeScript types (used by frontend + Lambda)
├── package.json                # npm workspaces root
├── tsconfig.json               # Root TS config
└── .gitignore
```

---

## Configuration Files

### `package.json` (Root)
```json
{
  "name": "@my-app/root",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":             "npm run dev --workspace=apps/frontend",
    "build":           "npm run build --workspace=apps/frontend",
    "test":            "npm run test --workspace=apps/frontend",
    "coverage":        "npm run coverage --workspace=apps/frontend",
    "deploy:backend":  "npm run deploy --workspace=apps/backend",
    "deploy":          "npm run build && npm run deploy:backend"
  }
}
```

### `tsconfig.json` (Root)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["dom", "esnext"],
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### `.gitignore`
```
node_modules/
dist/
build/
*.tsbuildinfo
.vite/
apps/backend/cdk.out/
apps/backend/dist/
.env
.env.local
.env.*.local
.aws-sam/
npm-debug.log*
*.log
.DS_Store
.vscode/
coverage/
```

---

## Shared Types Package

### `packages/shared/src/index.ts`
Define all types shared between the frontend and Lambda here. Both import from `@my-app/shared`.

```typescript
export type CardType = 'suspect' | 'clue' | 'evidence' | 'note';

export interface BoardCard {
  id: string;
  type: CardType;
  title: string;
  description: string;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface BoardState {
  cards: BoardCard[];
  connections: Connection[];
}
```

### `packages/shared/package.json`
```json
{
  "name": "@my-app/shared",
  "version": "0.1.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

---

## Frontend

### `apps/frontend/package.json`
```json
{
  "name": "@my-app/frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev":      "vite",
    "build":    "tsc && vite build",
    "preview":  "vite preview",
    "test":     "vitest run",
    "coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@my-app/shared": "*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@vitest/coverage-v8": "^1.6.1",
    "jsdom": "^24.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.6.1"
  }
}
```

### `apps/frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@my-app/shared": ["../../packages/shared/src/index.ts"]
    }
  },
  "include": ["src"],
  "exclude": ["src/test"]
}
```

> **Key:** `"exclude": ["src/test"]` keeps test files out of the production `tsc` check. Vitest has its own tsconfig inclusion.

### `apps/frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@my-app/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/api.ts'],
      thresholds: {
        lines:      70,
        functions:  70,
        branches:   70,
        statements: 70,
      },
    },
  },
});
```

### `apps/frontend/src/api.ts` — API / localStorage abstraction
```typescript
import type { BoardState } from '@my-app/shared';

// Set VITE_API_URL in .env.local after deploying the CDK stack.
// Without it the app falls back to localStorage so local dev still works.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const LOCAL_KEY = 'my-app-state';

export async function fetchBoard(): Promise<BoardState> {
  if (!API_URL) {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : { cards: [], connections: [] };
  }
  const res = await fetch(`${API_URL}/board`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function saveBoard(state: BoardState): Promise<void> {
  if (!API_URL) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    return;
  }
  const res = await fetch(`${API_URL}/board`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
```

### `apps/frontend/.env.example`
```
# Copy to .env.local and fill in after running cdk deploy
VITE_API_URL=https://api.yourdomain.com/my-app
```

### `apps/frontend/src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';

const store: Record<string, string> = {};
const localStorageMock = {
  getItem:    (key: string) => store[key] ?? null,
  setItem:    (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear:      () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key:        (i: number) => Object.keys(store)[i] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
```

### Testing pattern — mock the API module
Always mock `../api` in tests so they never hit the network:

```typescript
vi.mock('../api', () => ({
  fetchBoard: vi.fn().mockResolvedValue({ cards: [], connections: [] }),
  saveBoard:  vi.fn().mockResolvedValue(undefined),
}));
```

Use `waitFor` for async state that loads on mount:

```typescript
await waitFor(() =>
  expect(document.querySelector('.board:not(.board--loading)')).toBeInTheDocument()
);
```

---

## Backend — AWS CDK Stack

### `apps/backend/package.json`
```json
{
  "name": "@my-app/backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build":   "tsc",
    "synth":   "cdk synth",
    "deploy":  "cdk deploy --require-approval never",
    "destroy": "cdk destroy"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.180.0",
    "constructs":  "^10.4.2"
  },
  "devDependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb":    "^3.0.0",
    "@types/aws-lambda":        "^8.10.140",
    "@types/node":              "^20.0.0",
    "aws-cdk":                  "^2.180.0",
    "esbuild":                  "^0.25.0",
    "ts-node":                  "^10.9.0",
    "typescript":               "^5.0.0"
  }
}
```

### `apps/backend/cdk.json`
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true
  }
}
```

### `apps/backend/bin/app.ts`
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyAppStack } from '../lib/stack';

const app = new cdk.App();
new MyAppStack(app, 'MyAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region:  process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
```

### `apps/backend/lib/stack.ts` — Full CDK stack
```typescript
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

// ── Domain constants ─────────────────────────────────────────────────────────
const DOMAIN         = 'yourdomain.com';
const SITE_SUBDOMAIN = `app.${DOMAIN}`;      // e.g. app.yourdomain.com
const API_SUBDOMAIN  = `api.${DOMAIN}`;      // e.g. api.yourdomain.com
const API_BASE_PATH  = 'my-app';             // e.g. api.yourdomain.com/my-app

export class MyAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Route 53 hosted zone — must already exist for your domain
    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: DOMAIN });

    // ACM certificate (us-east-1 required for CloudFront)
    const cert = new acm.Certificate(this, 'Certificate', {
      domainName: SITE_SUBDOMAIN,
      subjectAlternativeNames: [API_SUBDOMAIN],
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // DynamoDB — PAY_PER_REQUEST, RETAIN on delete
    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Lambda (ARM64, Node 20, bundled by esbuild)
    const fn = new lambdaNodeJs.NodejsFunction(this, 'Handler', {
      entry: path.join(__dirname, '../lambda/handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: { TABLE_NAME: table.tableName },
      bundling: { externalModules: ['@aws-sdk/*'] },
    });
    table.grantReadWriteData(fn);

    // API Gateway with CORS locked to the frontend origin
    const api = new apigw.RestApi(this, 'Api', {
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: [`https://${SITE_SUBDOMAIN}`],
        allowMethods: ['GET', 'PUT', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      },
    });
    const resource = api.root.addResource('board');
    const integration = new apigw.LambdaIntegration(fn);
    resource.addMethod('GET', integration);
    resource.addMethod('PUT', integration);

    // Custom domain for API  →  api.yourdomain.com/my-app
    const apiDomain = new apigw.DomainName(this, 'ApiDomain', {
      domainName: API_SUBDOMAIN,
      certificate: cert,
    });
    new apigw.BasePathMapping(this, 'ApiMapping', {
      domainName: apiDomain,
      restApi: api,
      basePath: API_BASE_PATH,
    });
    new route53.ARecord(this, 'ApiRecord', {
      zone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apiDomain)),
    });

    // S3 bucket (private, served via CloudFront OAC)
    const bucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront distribution with custom domain + SPA fallback
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: [SITE_SUBDOMAIN],
      certificate: cert,
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });
    new route53.ARecord(this, 'SiteRecord', {
      zone,
      recordName: SITE_SUBDOMAIN.split('.')[0],
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // Deploy frontend dist/ → S3, invalidate CloudFront cache
    new s3deploy.BucketDeployment(this, 'FrontendDeploy', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', { value: `https://${SITE_SUBDOMAIN}` });
    new cdk.CfnOutput(this, 'ApiUrl',     { value: `https://${API_SUBDOMAIN}/${API_BASE_PATH}` });
  }
}
```

### `apps/backend/lambda/handler.ts` — Lambda function pattern
```typescript
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyHandler } from 'aws-lambda';

const TABLE_NAME = process.env.TABLE_NAME!;
const ddb = DynamoDBDocument.from(new DynamoDB());
const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'GET') {
    const result = await ddb.get({ TableName: TABLE_NAME, Key: { pk: 'STATE' } });
    return { statusCode: 200, headers: CORS, body: JSON.stringify(result.Item ?? {}) };
  }

  if (event.httpMethod === 'PUT') {
    const body = event.body ? JSON.parse(event.body) : null;
    if (!body) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Bad request' }) };
    await ddb.put({ TableName: TABLE_NAME, Item: { pk: 'STATE', ...body, updatedAt: new Date().toISOString() } });
    return { statusCode: 200, headers: CORS, body: JSON.stringify(body) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
};
```

---

## Deployment

### Prerequisites
```bash
brew install node       # Node.js + npm
brew install awscli     # AWS CLI
aws configure           # Enter Access Key ID, Secret, region, output format
```

### First-time setup
```bash
cd apps/backend
npx cdk bootstrap       # Once per AWS account/region
```

### Deploy everything
```bash
npm run deploy          # builds frontend → deploys CDK stack → uploads to S3
```

CDK outputs after deploy:
```
MyAppStack.WebsiteUrl = https://app.yourdomain.com
MyAppStack.ApiUrl     = https://api.yourdomain.com/my-app
```

Create `apps/frontend/.env.local`:
```
VITE_API_URL=https://api.yourdomain.com/my-app
```

### Domain requirements
- The domain must have a **Route 53 hosted zone** in the same AWS account.
- Do **not** create DNS records (A/CNAME) for the subdomains CDK manages — CloudFormation will fail if they already exist.
- Certificate validation is automatic via DNS (CDK creates the CNAME records in Route 53).
- ACM certificates used by CloudFront must be in **us-east-1** regardless of your stack region.

---

## Test Coverage

Run tests:
```bash
npm test        # run once
npm run coverage  # run with v8 coverage report
```

Coverage thresholds (enforced — build fails below these):

| Metric | Threshold |
|---|---|
| Statements | 70% |
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |

HTML coverage report: `apps/frontend/coverage/index.html`

**Coverage exclusions** — exclude files that are always mocked in tests:
```typescript
exclude: ['src/main.tsx', 'src/test/**', 'src/api.ts']
```

---

## Monorepo Best Practices

- **Workspaces:** `npm workspaces` — run any workspace script with `--workspace=apps/frontend`.
- **Shared types:** Put all cross-boundary interfaces in `packages/shared/` and alias them in both `tsconfig.json` and `vite.config.ts`.
- **Env vars:** Never commit `.env.local`. Keep `.env.example` in source control as a reference.
- **Test isolation:** Always mock `api.ts` in unit tests — never let tests hit real AWS endpoints.
- **Production tsc:** Exclude `src/test/` from `tsconfig.json` so test-only globals (`beforeEach`, `vi`) don't cause build errors.
- **CORS:** Lock `allowOrigins` in API Gateway to the frontend domain in production; use `Cors.ALL_ORIGINS` only in development stacks.
- **DynamoDB safety:** Use `removalPolicy: RemovalPolicy.RETAIN` on tables so data survives `cdk destroy`.

---

## Contributing Guidelines

1. Fork the repository and create a feature branch from `main`.
2. Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:` etc.).
3. Run `npm test` and `npm run coverage` — both must pass before opening a PR.
4. Run `npm run build` — production TypeScript must compile without errors.
5. Push your branch and open a Pull Request against `main`.