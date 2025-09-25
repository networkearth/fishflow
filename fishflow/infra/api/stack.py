from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_logs as logs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_certificatemanager as acm,
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

        # VPC for ECS (using default VPC for simplicity)
        vpc = ec2.Vpc.from_lookup(self, "DefaultVpc", is_default=True)

        # ECS Cluster
        cluster = ecs.Cluster(
            self, "FishFlowAPICluster", vpc=vpc, cluster_name="fishflow-api-cluster"
        )

        # Task execution role (for pulling images, writing logs)
        execution_role = iam.Role(
            self,
            "TaskExecutionRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ],
        )

        # Task role (for your app to access AWS services)
        task_role = iam.Role(
            self, "TaskRole", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )

        # Grant S3 read access to task role
        data_bucket.grant_read(task_role)

        # CloudWatch log group
        log_group = logs.LogGroup(
            self,
            "ApiLogGroup",
            log_group_name="/ecs/fishflow-api",
            retention=logs.RetentionDays.ONE_WEEK,
        )

        # Task Definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            "ApiTaskDefinition",
            memory_limit_mib=2048,  # 2GB RAM
            cpu=512,  # 0.5 vCPU
            execution_role=execution_role,
            task_role=task_role,
        )

        # Container Definition
        container = task_definition.add_container(
            "ApiContainer",
            image=ecs.ContainerImage.from_asset("../../backend"),
            memory_limit_mib=2048,
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="fishflow-api", log_group=log_group
            ),
            port_mappings=[
                ecs.PortMapping(container_port=8000, protocol=ecs.Protocol.TCP)
            ],
        )

        security_group = ec2.SecurityGroup(
            self,
            "ApiSecurityGroup",
            vpc=vpc,
            description="Security group for FishFlow API",
            allow_all_outbound=True,
        )

        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(8000),
            description="Allow HTTP traffic on port 8000",
        )

        # Fargate Service
        service = ecs.FargateService(
            self,
            "ApiService",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=1,  # Start with 1 container
            assign_public_ip=True,  # Needed for internet access
            service_name="fishflow-api-service",
            security_groups=[security_group],
        )

        hosted_zone = route53.HostedZone.from_lookup(
            self, "NetworkEarthZone", domain_name="networkearth.io"
        )

        api_certificate = acm.Certificate(
            self,
            "ApiCertificate",
            domain_name="api.networkearth.io",
            validation=acm.CertificateValidation.from_dns(hosted_zone),
        )

        load_balancer = elbv2.ApplicationLoadBalancer(
            self,
            "ApiLoadBalancer",
            vpc=vpc,
            internet_facing=True,
        )

        target_group = elbv2.ApplicationTargetGroup(
            self,
            "ApiTargetGroup",
            port=8000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            vpc=vpc,
            health_check=elbv2.HealthCheck(path="/", healthy_http_codes="200"),
        )

        load_balancer.add_listener(
            "HttpsListener",
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTPS,
            certificates=[api_certificate],
            default_target_groups=[target_group],
        )

        load_balancer.add_listener(
            "HttpListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(protocol="HTTPS", port="443"),
        )

        service.attach_to_application_target_group(target_group)

        route53.ARecord(
            self,
            "ApiAliasRecord",
            zone=hosted_zone,
            record_name="api",
            target=route53.RecordTarget.from_alias(
                targets.LoadBalancerTarget(load_balancer)
            ),
        )

        # Outputs
        CfnOutput(
            self,
            "DataBucketName",
            value=data_bucket.bucket_name,
            description="Name of the S3 bucket for data storage",
        )

        CfnOutput(
            self,
            "ClusterName",
            value=cluster.cluster_name,
            description="Name of the ECS cluster",
        )

        CfnOutput(
            self,
            "ServiceName",
            value=service.service_name,
            description="Name of the ECS service",
        )

        CfnOutput(
            self,
            "ApiUrl",
            value="https://api.networkearth.io",
            description="API endpoint URL",
        )
