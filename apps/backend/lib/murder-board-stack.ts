import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class MurderBoardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── DynamoDB ────────────────────────────────────────────────────────────
    const table = new dynamodb.Table(this, 'BoardTable', {
      tableName: 'murder-board',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // RETAIN so data survives stack updates/deletes
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
        // AWS SDK v3 is provided by the Lambda runtime
        externalModules: ['@aws-sdk/*'],
      },
    });

    table.grantReadWriteData(boardFn);

    // ── API Gateway (REST) ──────────────────────────────────────────────────
    const api = new apigw.RestApi(this, 'BoardApi', {
      restApiName: 'murder-board-api',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'PUT', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      },
    });

    const boardResource = api.root.addResource('board');
    const integration   = new apigw.LambdaIntegration(boardFn);
    boardResource.addMethod('GET', integration);
    boardResource.addMethod('PUT', integration);

    // ── Outputs ─────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Paste into apps/frontend/.env.local as VITE_API_URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
    });
  }
}
