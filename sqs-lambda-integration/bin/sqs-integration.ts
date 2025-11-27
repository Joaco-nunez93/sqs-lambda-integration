#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { SqsIntegrationStack } from '../lib/sqs-integration-stack';

const app = new cdk.App();
new SqsIntegrationStack(app, 'SqsIntegrationStack');
