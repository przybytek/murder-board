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

const DOMAIN        = 'przybytek.com';
const SITE_SUBDOMAIN = `murder-board.${DOMAIN}`;
const API_SUBDOMAIN  = `api.${DOMAIN}`;
const API_BASE_PATH  = 'murder-board';

export class MurderBoardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Route 53 hosted zone ────────────────────────────────────────────────
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: DOMAIN,
    });

    // ── TLS certificate (covers site subdomain and api subdomain) ──────────
    // Must be in us-east-1 for CloudFront.
    const cert = new acm.Certificate(this, 'Certificate', {
      domainName: SITE_SUBDOMAIN,
      subjectAlternativeNames: [API_SUBDOMAIN],
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // ── DynamoDB ────────────────────────────────────────────────────────────
    const table = new dynamodb.Table(this, 'BoardTable', {
      tableName: 'murder-board',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── Lambda ──────────────────────────────────────────────────────────────
    const boardFn = new lambdaNodeJs.NodejsFunction(this, 'BoardFunction', {
      entry: path.join(__dirname, '../lambda/board-handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
    });

    table.grantReadWriteData(boardFn);

    // ── API Gateway ─────────────────────────────────────────────────────────
    const api = new apigw.RestApi(this, 'BoardApi', {
      restApiName: 'murder-board-api',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: [`https://${DOMAIN}`, `https://www.${DOMAIN}`],
        allowMethods: ['GET', 'PUT', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      },
    });

    const boardResource = api.root.addResource('board');
    const integration   = new apigw.LambdaIntegration(boardFn);
    boardResource.addMethod('GET', integration);
    boardResource.addMethod('PUT', integration);

    // Custom domain for the API  →  api.przybytek.com/murder-board
    const apiDomain = new apigw.DomainName(this, 'ApiDomain', {
      domainName: API_SUBDOMAIN,
      certificate: cert,
    });
    new apigw.BasePathMapping(this, 'ApiMapping', {
      domainName: apiDomain,
      restApi: api,
      basePath: API_BASE_PATH,
    });
    new route53.ARecord(this, 'ApiAliasRecord', {
      zone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apiDomain)),
    });

    // ── S3 bucket ───────────────────────────────────────────────────────────
    const siteBucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ── CloudFront  →  murder-board.przybytek.com ───────────────────────────
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
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

    // murder-board.przybytek.com  →  CloudFront
    new route53.ARecord(this, 'SiteRecord', {
      zone,
      recordName: 'murder-board',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // ── Deploy frontend dist/ to S3 ─────────────────────────────────────────
    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // ── Outputs ─────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'WebsiteUrl', { value: `https://${SITE_SUBDOMAIN}` });
    new cdk.CfnOutput(this, 'ApiUrl',     { value: `https://${API_SUBDOMAIN}/${API_BASE_PATH}` });
    new cdk.CfnOutput(this, 'TableName',  { value: table.tableName });
  }
}
