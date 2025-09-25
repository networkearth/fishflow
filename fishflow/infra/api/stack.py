from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_iam as iam,
    Duration,
    CfnOutput,
)
from constructs import Construct


class FishFlowApiStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, config, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Data storage bucket for datasets
        data_bucket = s3.Bucket(
            self,
            "FishFlowDataBucket",
            bucket_name=f"fish-flow-data-bucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
        )

        # TODO: Add Lambda function here
        # TODO: Add API Gateway here
        # TODO: Add IAM permissions here

        # Outputs
        CfnOutput(
            self,
            "DataBucketName",
            value=data_bucket.bucket_name,
            description="Name of the S3 bucket for data storage",
        )
