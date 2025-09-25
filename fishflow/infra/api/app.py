from aws_cdk import App, Environment
from stack import FishFlowApiStack

app = App()
config = app.node.try_get_context("config")
env = Environment(account=config["account"], region=config["region"])

FishFlowApiStack(app, "FishFlowApiStack", config=config, env=env)  # Add this

app.synth()
