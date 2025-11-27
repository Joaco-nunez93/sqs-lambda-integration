import { Duration, Stack, StackProps } from 'aws-cdk-lib/core';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

export class SqsIntegrationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // se crea la cola sqs
    const queue = new sqs.Queue(this, 'SqsIntegrationQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    // se crea la lambda
    const sqs_lambda = new lambda.Function(this, "SQSLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'lambda_handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'))
    });

    // se conecta la cola SQS con la lambda
    sqs_lambda.addEventSource(new lambdaEventSources.SqsEventSource(queue));

  }
}
