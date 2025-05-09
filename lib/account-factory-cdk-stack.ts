// AWS CDK setup for Control Tower Batch Account Creation
// Language: TypeScript (CDK) and Python (Lambda functions)

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class ControlTowerBatchAccountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for input files
    const inputBucket = new s3.Bucket(this, 'InputBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // DynamoDB table to track account creation status
    const accountTable = new dynamodb.Table(this, 'AccountTable', {
      partitionKey: { name: 'AccountID', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE
    });

    // NewAccountHandler Lambda function
    const newAccountHandler = new lambda.Function(this, 'NewAccountHandlerLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'new_account_handler.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: accountTable.tableName
      }
    });
    accountTable.grantReadWriteData(newAccountHandler);

    // CreateManagedAccount Lambda function
    const createManagedAccount = new lambda.Function(this, ' tLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'create_managed_account.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: accountTable.tableName
      }
    });
    accountTable.grantReadWriteData(createManagedAccount);

    // CloudWatch rule for CreateManagedAccount lifecycle event
    const lifecycleEventRule = new cloudwatch.Rule(this, 'LifecycleEventRule', {
      eventPattern: {
        source: ['aws.controltower'],
        detailType: ['AWS Service Event via CloudTrail'],
        detail: {
          eventName: ['CreateManagedAccount']
        }
      }
    });
    lifecycleEventRule.addTarget(new targets.LambdaFunction(createManagedAccount));
  }
}
