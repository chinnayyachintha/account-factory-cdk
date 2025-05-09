#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ControlTowerBatchAccountStack } from '../lib/account-factory-cdk-stack';

const app = new cdk.App();
new ControlTowerBatchAccountStack(app, 'ControlTowerBatchAccountStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
});
