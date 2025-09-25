import os
from aws_cdk import App, Environment
from stack import FishFlowReact

app = App()
config = app.node.try_get_context("config")
env = Environment(account=config["account"], region=config["region"])

FishFlowReact(app, "FishFlowReactStack", config=config, env=env)

app.synth()
