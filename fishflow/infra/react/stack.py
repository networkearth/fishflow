from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_iam as iam,
    aws_route53 as route53,
    aws_certificatemanager as acm,
    aws_route53_targets as targets,
    CfnOutput,
)
from constructs import Construct


class FishFlowReact(Stack):

    def __init__(self, scope: Construct, construct_id: str, config, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        bucket = s3.Bucket(
            self,
            "FishFlowReactBucket",
            bucket_name=f"fish-flow-react-bucket",
            # Security configuration matching the YAML
            block_public_access=s3.BlockPublicAccess(
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True,
            ),
            # Enable versioning
            versioned=True,
            # Server-side encryption
            encryption=s3.BucketEncryption.S3_MANAGED,
        )

        oac = cloudfront.CfnOriginAccessControl(
            self,
            "CloudFrontOriginAccessControl",
            origin_access_control_config=cloudfront.CfnOriginAccessControl.OriginAccessControlConfigProperty(
                name="FishFlow-React-OAC",
                origin_access_control_origin_type="s3",
                signing_behavior="always",
                signing_protocol="sigv4",
                description="OAC for FishFlow React app",
            ),
        )

        hosted_zone = route53.HostedZone.from_lookup(
            self, "NetworkEarthZone", domain_name="networkearth.io"
        )

        certificate = acm.Certificate(
            self,
            "FishFlowCertificate",
            domain_name="networkearth.io",
            subject_alternative_names=["www.networkearth.io"],
            validation=acm.CertificateValidation.from_dns(hosted_zone),
        )

        distribution = cloudfront.CfnDistribution(
            self,
            "CFDistributionSPA",
            distribution_config=cloudfront.CfnDistribution.DistributionConfigProperty(
                aliases=["networkearth.io", "www.networkearth.io"],
                origins=[
                    cloudfront.CfnDistribution.OriginProperty(
                        domain_name=bucket.bucket_regional_domain_name,
                        id="myS3Origin",
                        s3_origin_config=cloudfront.CfnDistribution.S3OriginConfigProperty(
                            origin_access_identity=""  # Empty as per their config
                        ),
                        origin_access_control_id=oac.attr_id,
                    )
                ],
                enabled=True,
                default_root_object="index.html",
                default_cache_behavior=cloudfront.CfnDistribution.DefaultCacheBehaviorProperty(
                    allowed_methods=["GET", "HEAD", "OPTIONS"],
                    target_origin_id="myS3Origin",
                    cache_policy_id="658327ea-f89d-4fab-a63d-7e88639e58f6",  # CachingOptimized
                    origin_request_policy_id="88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",  # CORS-S3Origin
                    response_headers_policy_id="eaab4381-ed33-4a86-88ca-d9558dc6cd63",  # CORS-with-preflight-and-SecurityHeadersPolicy
                    viewer_protocol_policy="redirect-to-https",
                ),
                custom_error_responses=[
                    cloudfront.CfnDistribution.CustomErrorResponseProperty(
                        error_code=403,
                        response_code=200,
                        response_page_path="/index.html",
                    ),
                    cloudfront.CfnDistribution.CustomErrorResponseProperty(
                        error_code=404,
                        response_code=200,
                        response_page_path="/index.html",
                    ),
                ],
                price_class="PriceClass_All",
                viewer_certificate=cloudfront.CfnDistribution.ViewerCertificateProperty(
                    acm_certificate_arn=certificate.certificate_arn,
                    ssl_support_method="sni-only",
                    minimum_protocol_version="TLSv1.2_2021",
                ),
            ),
        )

        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="PolicyForCloudFrontPrivateContent",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                actions=["s3:GetObject*"],
                resources=[f"{bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{distribution.attr_id}"
                    }
                },
            )
        )

        route53.CfnRecordSet(
            self,
            "AliasRecord",
            hosted_zone_id=hosted_zone.hosted_zone_id,
            name="networkearth.io",
            type="A",
            alias_target=route53.CfnRecordSet.AliasTargetProperty(
                dns_name=distribution.attr_domain_name,
                hosted_zone_id="Z2FDTNDATAQYW2",  # CloudFront's hosted zone ID (always this)
            ),
        )

        # A record for www subdomain
        route53.CfnRecordSet(
            self,
            "WWWAliasRecord",
            hosted_zone_id=hosted_zone.hosted_zone_id,
            name="www.networkearth.io",
            type="A",
            alias_target=route53.CfnRecordSet.AliasTargetProperty(
                dns_name=distribution.attr_domain_name,
                hosted_zone_id="Z2FDTNDATAQYW2",  # CloudFront's hosted zone ID (always this)
            ),
        )

        CfnOutput(
            self,
            "HostedZoneId",
            value=hosted_zone.hosted_zone_id,
            description="Route 53 Hosted Zone ID",
        )

        CfnOutput(
            self,
            "CertificateArn",
            value=certificate.certificate_arn,
            description="SSL Certificate ARN",
        )

        CfnOutput(
            self,
            "CustomDomainURL",
            value="https://networkearth.io",
            description="Custom domain URL",
        )
